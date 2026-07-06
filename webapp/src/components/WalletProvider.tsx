"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { WagmiProvider, createConfig, http, useAccount, useConnect, useDisconnect } from "wagmi";
import { mainnet, polygon, celo } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected, walletConnect } from "wagmi/connectors";
import { generateMnemonic, english } from 'viem/accounts';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';
import { SeedSignerEvm } from '@tetherto/wdk-wallet-evm/signers';

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
  const { address, isConnected, connector } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();

  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    authMethod: null,
    seedPhrase: null,
    wdkAccount: null,
  });

  const [isRegistered, setIsRegistered] = useState(false);

  // Sync Wagmi state
  useEffect(() => {
    if (isConnected && address) {
      setState(prev => ({
        ...prev,
        isConnected: true,
        address: address,
        authMethod: "metamask", // For now we assume Metamask/Wagmi
      }));
      // Mock db check: let's pretend addresses starting with 0x1 are unregistered
      setIsRegistered(!address.startsWith("0x1"));
    } else if (state.authMethod === "metamask") {
      setState(prev => ({
        ...prev,
        isConnected: false,
        address: null,
        authMethod: null,
      }));
    }
  }, [isConnected, address]);

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
      
      setState({
        isConnected: true,
        address: generatedAddress,
        authMethod: "wdk",
        seedPhrase: mnemonic,
        wdkAccount: account,
      });
      setIsRegistered(false); // WDK always new in this flow
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

      setState({
        isConnected: true,
        address: generatedAddress,
        authMethod: "wdk",
        seedPhrase: mnemonic,
        wdkAccount: account,
      });
      setIsRegistered(true);
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
    setState({
      isConnected: false,
      address: null,
      authMethod: null,
      seedPhrase: null,
      wdkAccount: null,
    });
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
