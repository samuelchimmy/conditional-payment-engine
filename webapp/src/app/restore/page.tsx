"use client";

import { useRouter } from "next/navigation";
import { GoogleDriveRestore } from "@/components/GoogleDriveRestore";
import { useWallet } from "@/components/WalletProvider";

export default function RestorePage() {
  const router = useRouter();
  const { restoreWallet } = useWallet() as any; // We'll add this next

  const handleRestore = async (payload: string, pin: string) => {
    try {
      // The payload is the seed phrase from Google Drive backup
      const restoredWallet = await restoreWallet(payload);
      
      return {
        success: true,
        profileId: undefined, // Usually fetched or derived from DB if needed
        walletAddress: restoredWallet.address
      };
    } catch (e: any) {
      console.error(e);
      return {
        success: false,
        error: e.message || "Failed to restore wallet"
      };
    }
  };

  return (
    <div className="w-full max-w-[420px] flex flex-col pt-12">
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-text-primary text-[28px] font-[800]">
          Restore your wallet
        </h1>
        <p className="text-text-muted text-[14px] mt-2">
          Securely recover your wallet from Google Drive.
        </p>
      </div>

      <div className="w-full bg-surface border border-border rounded-[10px] p-6">
        <GoogleDriveRestore onRestore={handleRestore} />
      </div>

      <button 
        onClick={() => router.push("/connect")}
        className="mt-8 text-text-secondary hover:text-text-primary text-[14px] transition-colors"
      >
        Back to Connect
      </button>
    </div>
  );
}
