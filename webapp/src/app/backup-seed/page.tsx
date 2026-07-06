"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import { GoogleDriveBackup } from "@/components/GoogleDriveBackup";

export default function BackupSeed() {
  const router = useRouter();
  const { seedPhrase } = useWallet();
  const [loadingCloud, setLoadingCloud] = useState(false);
  const [words, setWords] = useState<string[]>([]);

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
    <div className="w-full max-w-[420px] flex flex-col pt-8 pb-12">
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-text-primary text-[28px] font-[800] leading-tight">
          Backup your wallet
        </h1>
        <p className="text-text-muted text-[14px] mt-2">
          This 12-word phrase is the only way to recover your wallet if you lose access.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-[10px] p-5 mb-8">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {words.map((word, index) => (
            <div key={index} className="flex flex-col gap-1">
              <span className="text-text-muted text-[11px] uppercase tracking-wider">{index + 1}</span>
              <span className="text-text-primary font-bold text-[15px]">{word}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-divider">
          <span className="text-text-muted text-[13px]">Never share this phrase with anyone.</span>
          <button 
            className="text-text-primary text-[13px] font-bold hover:text-white transition-colors"
            onClick={() => navigator.clipboard.writeText(words.join(" "))}
          >
            Copy All
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
