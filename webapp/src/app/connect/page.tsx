"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";

export default function ConnectWallet() {
  const router = useRouter();
  const { isConnected, isRegistered, authMethod, connectWagmi, connectWdk, connectGoogle } = useWallet();
  const [loadingMethod, setLoadingMethod] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected) {
      if (isRegistered) {
        router.push("/dashboard");
      } else if (authMethod === "metamask" || authMethod === "walletconnect") {
        router.push("/link-socials");
      } else {
        router.push("/backup-seed");
      }
    }
  }, [isConnected, isRegistered, router]);

  const handleConnect = async (method: "wdk" | "metamask" | "walletconnect" | "google") => {
    setLoadingMethod(method);
    try {
      if (method === "wdk") {
        await connectWdk();
      } else if (method === "google") {
        router.push("/restore");
      } else if (method === "metamask") {
        await connectWagmi("injected");
      } else if (method === "walletconnect") {
        await connectWagmi("walletConnect");
      }
    } catch (e) {
      console.error(e);
      setLoadingMethod(null);
    }
  };

  return (
    <div className="w-full max-w-[420px] flex flex-col pt-8">
      <div className="mb-10 text-center">
        <h1 className="text-text-primary text-[22px] font-[800]">
          Connect your wallet
        </h1>
        <p className="text-text-muted text-[13px] mt-2">
          Choose how to continue
        </p>
      </div>

      <div className="flex flex-col gap-4 mb-4">
        {/* Create new wallet */}
        <button 
          onClick={() => handleConnect("wdk")}
          disabled={loadingMethod !== null}
          className="w-full h-[60px] bg-surface border border-border-emphasis hover:bg-[#151515] transition-colors rounded-[10px] px-5 flex items-center justify-between group disabled:opacity-50"
        >
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 flex items-center justify-center overflow-hidden">
              <img src="/wdk-logo.svg" alt="WDK" className="h-[14px] w-auto ml-1 opacity-90 transition-all duration-300 theme-logo-wdk" />
            </div>
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2">
                <span className="text-text-primary text-[14px] font-bold">Create new wallet</span>
                <span className="bg-[#009393] text-accent-text text-[9px] px-1.5 py-0.5 rounded-[4px] font-bold uppercase tracking-wide">Recommended</span>
              </div>
              <span className="text-text-muted text-[12px] font-normal">(~30 sec)</span>
            </div>
          </div>
          {loadingMethod === "wdk" ? (
            <div className="animate-spin h-4 w-4 border-2 border-text-secondary border-t-transparent rounded-full" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-text-secondary group-hover:text-text-primary transition-colors">
              <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

        {/* MetaMask */}
        <button 
          onClick={() => handleConnect("metamask")}
          disabled={loadingMethod !== null}
          className="w-full h-[60px] bg-surface border border-border hover:border-border-emphasis transition-colors rounded-[10px] px-5 flex items-center justify-between group disabled:opacity-50"
        >
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 flex items-center justify-center">
              <img src="/MetaMask-icon-fox.svg" alt="MetaMask" className="w-7 h-7 object-contain opacity-90 transition-all duration-300 theme-logo-mm" />
            </div>
            <span className="text-text-primary text-[14px] font-bold">MetaMask or browser wallet</span>
          </div>
          {loadingMethod === "metamask" ? (
            <div className="animate-spin h-4 w-4 border-2 border-text-secondary border-t-transparent rounded-full" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-text-secondary group-hover:text-text-primary transition-colors">
              <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

        {/* WalletConnect */}
        <button 
          onClick={() => handleConnect("walletconnect")}
          disabled={loadingMethod !== null}
          className="w-full h-[60px] bg-surface border border-border hover:border-border-emphasis transition-colors rounded-[10px] px-5 flex items-center justify-between group disabled:opacity-50"
        >
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 flex items-center justify-center">
              <img src="/walletconnect.svg" alt="WalletConnect" className="w-7 h-7 object-contain opacity-90 transition-all duration-300 theme-logo-wc" />
            </div>
            <span className="text-text-primary text-[14px] font-bold">WalletConnect</span>
          </div>
          {loadingMethod === "walletconnect" ? (
            <div className="animate-spin h-4 w-4 border-2 border-text-secondary border-t-transparent rounded-full" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-text-secondary group-hover:text-text-primary transition-colors">
              <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>

      <p className="text-text-muted text-[12px] text-center mb-10">
        New wallets include a 12-word phrase and Google Drive backup.
      </p>

      <button 
        onClick={() => handleConnect("google")}
        disabled={loadingMethod !== null}
        className="w-full h-[46px] bg-accent text-accent-text text-[14px] font-bold rounded-[10px] flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loadingMethod === "google" ? (
          <div className="animate-spin h-5 w-5 border-2 border-accent-text border-t-transparent rounded-full" />
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
              <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.78 15.69 17.57V20.34H19.26C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="currentColor"/>
              <path d="M12 23C14.97 23 17.46 22.02 19.26 20.34L15.69 17.57C14.71 18.23 13.47 18.63 12 18.63C9.16 18.63 6.75 16.71 5.88 14.15H2.21V17C4.01 20.59 7.7 23 12 23Z" fill="currentColor"/>
              <path d="M5.88 14.15C5.66 13.49 5.54 12.76 5.54 12C5.54 11.24 5.66 10.51 5.88 9.85V7H2.21C1.47 8.48 1.05 10.18 1.05 12C1.05 13.82 1.47 15.52 2.21 17L5.88 14.15Z" fill="currentColor"/>
              <path d="M12 5.38C13.62 5.38 15.06 5.93 16.2 7.02L19.34 3.88C17.45 2.12 14.97 1 12 1C7.7 1 4.01 3.41 2.21 7L5.88 9.85C6.75 7.29 9.16 5.38 12 5.38Z" fill="currentColor"/>
            </svg>
            Continue with Google
          </>
        )}
      </button>
    </div>
  );
}
