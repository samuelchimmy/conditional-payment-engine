"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import { GoogleDriveBackup } from "@/components/GoogleDriveBackup";
import { toast } from "react-hot-toast";

export default function BackupSeed() {
  const router = useRouter();
  const { seedPhrase } = useWallet();
  const [loadingCloud, setLoadingCloud] = useState(false);
  const [words, setWords] = useState<string[]>([]);
  const [showSeed, setShowSeed] = useState(false);

  useEffect(() => {
    if (seedPhrase) {
      setWords(seedPhrase.split(" "));
    } else {
      // Fallback if accessed without generating (or redirect to /connect)
      router.push("/connect");
    }
  }, [seedPhrase, router]);
  

  const handleManualBackup = () => {
    // Proceed to next onboarding step assuming they wrote it down
    router.push("/link-socials");
  };

  return (
    <div className="w-full max-w-[420px] flex flex-col pt-8 pb-12 mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-text-primary text-[26px] font-[800] leading-tight">
          Backup your wallet
        </h1>
        <p className="text-text-muted text-[14px] mt-2">
          This 12-word phrase is the only way to recover your wallet if you lose access.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-[10px] p-4 mb-6">
        <div className="relative">
          <div className={`grid grid-cols-3 gap-2 mb-2 transition-all duration-300 ${!showSeed ? 'blur-[5px] select-none opacity-70' : ''}`}>
            {words.map((word, index) => (
              <div key={index} className="flex items-center gap-1.5 bg-bg-edge border border-border rounded-[6px] px-2 py-1">
                <span className="text-text-muted text-[10px] w-4 text-right">{index + 1}.</span>
                <span className="text-text-primary font-medium text-[12px]">{word}</span>
              </div>
            ))}
          </div>

          {!showSeed && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <button 
                onClick={() => setShowSeed(true)}
                className="flex items-center gap-2 bg-bg-center border border-border px-4 py-2 rounded-full text-text-primary text-[12px] font-bold shadow-xl hover:bg-surface transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4C7 4 2.73 7.11 1 12C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12C21.27 7.11 17 4 12 4ZM12 17.5C8.96 17.5 6.5 15.04 6.5 12C6.5 8.96 8.96 6.5 12 6.5C15.04 6.5 17.5 8.96 17.5 12C17.5 15.04 15.04 17.5 12 17.5ZM12 8.5C10.07 8.5 8.5 10.07 8.5 12C8.5 13.93 10.07 15.5 12 15.5C13.93 15.5 15.5 13.93 15.5 12C15.5 10.07 13.93 8.5 12 8.5Z" fill="currentColor"/>
                </svg>
                Reveal Seed Phrase
              </button>
            </div>
          )}
          
          {showSeed && (
            <button 
              onClick={() => setShowSeed(false)}
              className="absolute -top-2 -right-2 z-10 w-7 h-7 flex items-center justify-center bg-bg-center border border-border rounded-full text-text-muted hover:text-text-primary shadow-md transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.83 9L15 12.16V12C15 10.34 13.66 9 12 9H11.83ZM12 17.5C10.87 17.5 9.87 17.06 9.11 16.36L10.54 14.93C10.95 15.28 11.45 15.5 12 15.5C13.93 15.5 15.5 13.93 15.5 12C15.5 11.45 15.28 10.95 14.93 10.54L16.36 9.11C17.06 9.87 17.5 10.87 17.5 12C17.5 15.04 15.04 17.5 12 17.5ZM2.27 3L1 4.27L3.28 6.55C1.84 8.01 0.74 9.87 0 12C1.73 16.89 6 20 11 20C12.55 20 14.03 19.67 15.38 19.1L19.73 23.45L21 22.18L2.27 3ZM11 17.5C8.96 17.5 6.5 15.04 6.5 12C6.5 10.92 6.96 9.94 7.69 9.14L14.86 16.31C14.06 17.04 13.08 17.5 11 17.5ZM7.53 4.27L9 5.74C9.64 5.59 10.3 5.5 11 5.5C16 5.5 20.27 8.61 22 13.5C21.43 15.07 20.5 16.48 19.34 17.61L20.81 19.08C22.25 17.67 23.37 15.75 24 13.5C22.27 8.61 18 5.5 13 5.5C11.95 5.5 10.93 5.66 9.95 5.95L8.27 4.27C9.17 3.92 10.07 3.5 11 3.5C7.3 3.5 4 4.87 1.83 6.95L3.26 8.38C4.54 7.12 6.07 6.13 7.53 4.27Z" fill="currentColor"/>
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center justify-center mt-4 pt-4 border-t border-divider">
          <button 
            className="text-text-primary text-[13px] font-bold hover:text-white transition-colors"
            onClick={() => {
              navigator.clipboard.writeText(words.join(" "));
              toast.success("Seed phrase copied to clipboard!");
            }}
          >
            Copy
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Cloud Backup */}
        <div className="w-full">
          <GoogleDriveBackup 
            payloadToBackup={seedPhrase || ""} 
            payTag={useWallet().address || "unknown"} 
            onSuccess={() => router.push("/link-socials")}
          />
        </div>

        {/* Manual Backup */}
        <button 
          onClick={handleManualBackup}
          className="w-full h-[72px] bg-transparent border border-border hover:border-border-emphasis transition-colors rounded-[10px] px-5 flex items-center justify-between group"
        >
          <div className="flex flex-col items-start justify-center">
            <span className="text-text-primary text-[15px] font-bold mb-1">I wrote it down</span>
            <span className="text-text-muted text-[13px]">Proceed without cloud backup</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-text-secondary group-hover:text-text-primary transition-colors">
            <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
