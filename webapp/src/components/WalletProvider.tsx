"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { WagmiProvider, createConfig, http, useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import { mainnet, polygon, celo } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected, walletConnect } from "wagmi/connectors";
import { generateMnemonic, english } from 'viem/accounts';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';
import { SeedSignerEvm } from '@tetherto/wdk-wallet-evm/signers';
import { supabase } from '@/lib/supabaseClient';
import { getProfile } from '@/lib/dbProxy';
import { ensureGasForWallet } from '@/lib/gasGuard';


// Wagmi config
const wagmiConfig = createConfig({
  chains: [celo, polygon, mainnet],
  connectors: [
    injected(),
    walletConnect({ projectId: '9a46df484cb946e0e12e1367450e05fe' }),
  ],
  transports: {
    [celo.id]: http(),
    [polygon.id]: http(),
    [mainnet.id]: http(),
  },
});

const queryClient = new QueryClient();

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  authMethod: "metamask" | "walletconnect" | "google" | "wdk" | null;
  seedPhrase: string | null;
  wdkAccount: any | null;
  isInitialized: boolean;
}

interface WalletContextType extends WalletState {
  connectWagmi: (connectorId?: string) => Promise<void>;
  connectWdk: () => Promise<void>;
  restoreWallet: (seedPhrase: string) => Promise<{address: string}>;
  connectGoogle: () => Promise<void>;
  disconnectWallet: () => void;
  isRegistered: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

function WalletProviderInner({ children }: { children: React.ReactNode }) {
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    authMethod: null,
    seedPhrase: null,
    wdkAccount: null,
    isInitialized: false,
  });

  const { address, isConnected, isReconnecting, connector } = useAccount();
  
  const [isWdkGoogleInitialized, setIsWdkGoogleInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const stored = localStorage.getItem('tarena_auth');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.authMethod === 'wdk' && parsed.seedPhrase) {
            await restoreWallet(parsed.seedPhrase);
          } else if (parsed.authMethod === 'google') {
            await connectGoogle();
          }
        }
      } catch (e) {
        console.error("Failed to restore auth", e);
      } finally {
        setIsWdkGoogleInitialized(true);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.authMethod === 'wdk' && state.seedPhrase) {
      localStorage.setItem('tarena_auth', JSON.stringify({ authMethod: 'wdk', seedPhrase: state.seedPhrase }));
    } else if (state.authMethod === 'google') {
      localStorage.setItem('tarena_auth', JSON.stringify({ authMethod: 'google' }));
    } else if (!state.authMethod || state.authMethod === 'metamask') {
      localStorage.removeItem('tarena_auth');
    }
  }, [state.authMethod, state.seedPhrase]);

  useEffect(() => {
    setState(prev => ({
      ...prev,
      isInitialized: isWdkGoogleInitialized && !isReconnecting
    }));
  }, [isWdkGoogleInitialized, isReconnecting]);

  const [isRegistered, setIsRegistered] = useState(false);

  // Sync Wagmi state
  useEffect(() => {
    let mounted = true;
    const checkRegistration = async (addr: string) => {
      try {
        const { data } = await getProfile(addr);
        if (mounted) {
          setIsRegistered(!!data);
        }
      } catch (err) {
        console.error("Failed to check registration", err);
      }
    };

    if (isConnected && address) {
      // Don't re-authenticate if we already have a valid token for this address
      const existingToken = localStorage.getItem(`tarena_jwt`);
      let needsAuth = true;
      if (existingToken) {
        try {
          const payload = JSON.parse(atob(existingToken.split('.')[1]));
          if (payload.wallet_address === address.toLowerCase() && payload.exp * 1000 > Date.now()) {
            needsAuth = false;
          }
        } catch (e) {
          // invalid token
        }
      }

      setState(prev => ({
        ...prev,
        isConnected: true,
        address: address,
        authMethod: "metamask",
      }));

      if (needsAuth) {
        authenticateWallet(address).then((token) => {
          if (token) checkRegistration(address);
          else disconnectWallet(); // disconnect if auth fails
        });
      } else {
        checkRegistration(address);
      }
    } else if (state.authMethod === "metamask") {
      setState(prev => ({
        ...prev,
        isConnected: false,
        address: null,
        authMethod: null,
      }));
      setIsRegistered(false);
      localStorage.removeItem('tarena_jwt');
    }
    return () => { mounted = false; };
  }, [isConnected, address]);

  // SIWE Authentication helper. Accepts an optional signer so WDK wallets
  // (which have no wagmi connector) can authenticate by signing with their own
  // account. Without a JWT, every db-proxy call 401s — so this must run for
  // WDK wallets too, not just injected/WalletConnect.
  const authenticateWallet = async (
    addr: string,
    signFn?: (message: string) => Promise<string>,
  ) => {
    try {
      const resNonce = await supabase.functions.invoke('auth-session', {
        body: { action: 'nonce', wallet_address: addr }
      });
      if (resNonce.error) throw resNonce.error;
      const { nonce } = resNonce.data;

      const message = `Sign this message to authenticate with tether.arena.\nNonce: ${nonce}`;
      const signature = signFn ? await signFn(message) : await signMessageAsync({ message });

      const resVerify = await supabase.functions.invoke('auth-session', {
        body: { action: 'verify', message, signature, wallet_address: addr }
      });
      if (resVerify.error) throw resVerify.error;

      const { token } = resVerify.data;
      localStorage.setItem(`tarena_jwt`, token);
      return token;
    } catch (err) {
      console.error("SIWE Auth failed", err);
      return null;
    }
  };

  const connectWagmi = async (connectorId?: string) => {
    try {
      const targetConnector = connectors.find(c => c.id === connectorId) || connectors[0];
      await connectAsync({ connector: targetConnector });
    } catch (error) {
      console.error("Wagmi connection failed", error);
    }
  };

  const connectWdk = async () => {
    try {
      // 1. Generate a new BIP-39 mnemonic
      const mnemonic = generateMnemonic(english);
      
      // 2. Initialize WDK Evm Signer
      const root = new SeedSignerEvm(mnemonic);
      
      // 3. Create Wallet Manager configured for Celo
      const wallet = new WalletManagerEvm(root, {
        provider: 'https://forno.celo.org', // Celo mainnet public RPC
      });
      
      // 4. Retrieve the first account
      const account = await wallet.getAccount(0);
      const generatedAddress = await account.getAddress();

      setState(prev => ({
        ...prev,
        isConnected: true,
        address: generatedAddress,
        authMethod: "wdk",
        seedPhrase: mnemonic,
        wdkAccount: account,
      }));
      setIsRegistered(false); // WDK always new in this flow

      // Authenticate (SIWE) first so the JWT exists, THEN request the gas drip
      // (the funder now requires that token). Sign with the WDK account.
      authenticateWallet(generatedAddress, (m) => account.sign(m))
        .then(() => ensureGasForWallet(generatedAddress, { waitMs: 0 }))
        .catch(() => {});
    } catch (error) {
      console.error("WDK setup failed:", error);
      throw error;
    }
  };

  const restoreWallet = async (mnemonic: string) => {
    try {
      const root = new SeedSignerEvm(mnemonic);
      const wallet = new WalletManagerEvm(root, {
        provider: 'https://forno.celo.org', // Celo mainnet public RPC
      });
      const account = await wallet.getAccount(0);
      const generatedAddress = await account.getAddress();

      setState(prev => ({
        ...prev,
        isConnected: true,
        address: generatedAddress,
        authMethod: "wdk",
        seedPhrase: mnemonic,
        wdkAccount: account,
      }));
      setIsRegistered(true);

      // Ensure a valid JWT for db-proxy on restored WDK sessions (re-auth if the
      // cached token is missing/expired). Sign with the WDK account.
      const existing = typeof window !== 'undefined' ? localStorage.getItem('tarena_jwt') : null;
      let valid = false;
      if (existing) {
        try {
          const payload = JSON.parse(atob(existing.split('.')[1]));
          valid = payload.wallet_address === generatedAddress.toLowerCase() && payload.exp * 1000 > Date.now();
        } catch { /* invalid */ }
      }
      if (!valid) {
        // Re-auth, then request gas (funder requires the token).
        authenticateWallet(generatedAddress, (m) => account.sign(m))
          .then(() => ensureGasForWallet(generatedAddress, { waitMs: 0 }))
          .catch(() => {});
      } else {
        ensureGasForWallet(generatedAddress, { waitMs: 0 }).catch(() => {});
      }

      return { address: generatedAddress };
    } catch (e: any) {
      throw new Error(`Restore failed: ${e.message}`);
    }
  };

  const connectGoogle = async () => {
    // Mock Google connection
    const mockAddress = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    setState((prev) => ({
      ...prev,
      isConnected: true,
      address: mockAddress,
      authMethod: "google",
    }));
    setIsRegistered(true); // Google always registered in this test
  };

  const disconnectWallet = async () => {
    if (state.authMethod === "metamask" || isConnected) {
      await disconnectAsync();
    }
    setState(prev => ({
      ...prev,
      isConnected: false,
      address: null,
      authMethod: null,
      seedPhrase: null,
      wdkAccount: null,
    }));
    setIsRegistered(false);
  };

  return (
    <WalletContext.Provider value={{ ...state, connectWagmi, connectWdk, restoreWallet, connectGoogle, disconnectWallet, isRegistered }}>
      {children}
    </WalletContext.Provider>
  );
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <WalletProviderInner>{children}</WalletProviderInner>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
