"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";

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
  

  const handleCloudBackup = () => {
    if (!seedPhrase) return;
    setLoadingCloud(true);

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === "YOUR_GOOGLE_CLIENT_ID") {
      console.warn("Google Client ID not configured.");
      // Simulate for development if no keys
      setTimeout(() => {
        setLoadingCloud(false);
        router.push("/link-socials");
      }, 1500);
      return;
    }

    try {
      // @ts-ignore - google is loaded via script tag
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/drive.appdata",
        callback: async (response: any) => {
          if (response.error !== undefined) {
            console.error("Google Auth Error:", response);
            setLoadingCloud(false);
            return;
          }
          
          await uploadToGoogleDrive(response.access_token, seedPhrase);
        },
      });
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (e) {
      console.error(e);
      setLoadingCloud(false);
    }
  };

  const uploadToGoogleDrive = async (accessToken: string, phrase: string) => {
    try {
      const fileContent = JSON.stringify({
        seedPhrase: phrase,
        timestamp: new Date().toISOString()
      });

      const metadata = {
        name: 'tarena_wallet_backup.json',
        parents: ['appDataFolder'],
        mimeType: 'application/json'
      };

      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        fileContent +
        close_delim;

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody
      });

      if (!res.ok) {
        throw new Error("Failed to upload to Google Drive");
      }

      setLoadingCloud(false);
      router.push("/link-socials");
    } catch (error) {
      console.error("Upload error", error);
      setLoadingCloud(false);
    }
  };

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
        <button 
          onClick={handleCloudBackup}
          disabled={loadingCloud}
          className="w-full h-[72px] bg-surface border border-border-emphasis hover:bg-[#151515] transition-colors rounded-[10px] px-5 flex items-center justify-between group disabled:opacity-50"
        >
          <div className="flex flex-col items-start justify-center">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-text-primary text-[15px] font-bold">Cloud Backup</span>
              <span className="bg-[#009393] text-accent-text text-[9px] px-1.5 py-0.5 rounded-[4px] font-bold uppercase tracking-wide">Recommended</span>
            </div>
            <span className="text-text-muted text-[13px]">Securely save to Google Drive</span>
          </div>
          {loadingCloud ? (
            <div className="animate-spin h-4 w-4 border-2 border-text-secondary border-t-transparent rounded-full" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-text-secondary group-hover:text-text-primary transition-colors">
              <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

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
