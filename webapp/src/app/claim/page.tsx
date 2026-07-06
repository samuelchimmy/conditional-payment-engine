"use client";

import Link from "next/link";
import { useState } from "react";
import { useSignMessage } from "wagmi";
import { useWallet } from "@/components/WalletProvider";

export default function Claim() {
  const { address } = useWallet();
  const { signMessageAsync } = useSignMessage();
  const [claiming, setClaiming] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null);

  const handleClaim = async () => {
    if (!address) {
      setResult({ success: false, message: "Please connect your wallet first." });
      return;
    }

    setClaiming(true);
    setResult(null);

    try {
      const message = `Claim IOUs for ${address} at ${new Date().toISOString()}`;
      
      // Request signature from user's wallet
      const signature = await signMessageAsync({ message });

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) throw new Error("Supabase URL not configured");

      const res = await fetch(`${supabaseUrl}/functions/v1/secure-claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: "claim-all",
          walletAddress: address,
          message,
          signature
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to claim IOUs");
      }

      setResult({ success: true, message: data.message });
    } catch (error: any) {
      console.error("Claim Error:", error);
      setResult({ success: false, message: error.message || "An error occurred during claiming." });
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="w-full flex justify-center pt-8">
      {/* Light Theme Card for Claiming */}
      <div className="w-full max-w-[420px] bg-[#F2F1EF] rounded-[16px] p-8 text-[#050505]">
        <div className="flex justify-center mb-10">
          <div className="flex flex-col items-center gap-2">
            <img src="/logo.png" alt="tether.arena logo" className="w-12 h-12 object-contain" />
            <div className="flex items-baseline gap-0.5">
              <span className="font-[800] text-[#050505] text-[20px] tracking-tight">tether</span>
              <span className="font-[800] text-[#797977] text-[20px]">.</span>
              <span className="font-[400] text-[#050505] text-[20px] tracking-tight">arena</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <span className="text-[#797977] text-[10px] font-normal uppercase tracking-[0.1em]">
            SECURE CLAIM
          </span>
          <h1 className="text-[#050505] text-[40px] font-[800] leading-none mt-2 mb-3 tracking-tight">
            Claim Funds
          </h1>
          <p className="text-[#797977] text-[14px]">
            Claim all pending IOUs sent to your linked social accounts.
          </p>
        </div>

        {result && (
          <div className={`mb-6 p-4 rounded-[10px] text-[13px] font-bold ${result.success ? 'bg-[#D1FADF] text-[#027A48]' : 'bg-[#FEE4E2] text-[#B42318]'}`}>
            {result.message}
          </div>
        )}

        <div className="w-full h-[1px] bg-[#D1D1D1] mb-6"></div>

        <div className="flex flex-col mb-6">
          <label className="text-[#797977] text-[12px] mb-2">Claim to Wallet</label>
          <div className="w-full h-[52px] bg-[#E2E1DF] border border-[#D1D1D1] rounded-[10px] px-4 flex items-center text-[#797977] text-[14px]">
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}
          </div>
        </div>

        <p className="text-[#797977] text-[13px] mb-4">
          You will be prompted to sign a message to prove ownership of this wallet before funds are released.
        </p>

        <div className="flex flex-col gap-3">
          <button 
            onClick={handleClaim}
            disabled={claiming || !address}
            className="w-full h-[52px] bg-[#D53131] text-[#000000] font-bold rounded-[10px] flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {claiming ? (
              <div className="animate-spin h-5 w-5 border-2 border-[#000000] border-t-transparent rounded-full" />
            ) : (
              "Securely Claim All"
            )}
          </button>
          
          <Link 
            href="/dashboard"
            className="w-full h-[52px] bg-transparent text-[#050505] border border-[#050505] font-bold rounded-[10px] flex items-center justify-center hover:bg-[#E2E1DF] transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
