"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { ERC20ABI, USDTAddressCelo, IOURegistryV3Address } from "@/lib/contracts";

function ApproveContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const amountParam = searchParams.get("amount");
  const [amount, setAmount] = useState(amountParam || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const { writeContractAsync } = useWriteContract();

  useEffect(() => {
    if (amountParam) {
      setAmount(amountParam);
    }
  }, [amountParam]);

  const handleApprove = async () => {
    if (!amount) return;
    try {
      setIsProcessing(true);
      const amountParsed = parseUnits(amount, 6);
      
      await writeContractAsync({
        address: USDTAddressCelo,
        abi: ERC20ABI,
        functionName: "approve",
        args: [IOURegistryV3Address as `0x${string}`, amountParsed],
      });

      setSuccess(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-[440px] flex flex-col pt-8 items-center text-center">
        <div className="w-16 h-16 rounded-full bg-accent text-accent-text flex items-center justify-center mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h1 className="text-text-primary text-[22px] font-[800]">Approval Granted!</h1>
        <p className="text-text-muted text-[13px] mt-2 mb-8">You can now send your command to the bot again. It will automatically detect your approval.</p>
        <Link href="/dashboard" className="w-full h-[46px] bg-surface border border-border text-text-primary text-[14px] font-bold rounded-[10px] flex items-center justify-center hover:bg-border transition-colors">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[440px] flex flex-col pt-8">
      <div className="mb-6 text-center sm:text-left">
        <h1 className="text-text-primary text-[28px] font-[800]">
          Approve allowance
        </h1>
        <p className="text-text-muted text-[14px] mt-2">
          Grant the engine permission to move your USDT only when your bet conditions are met.
        </p>
      </div>

      <div className="w-full flex flex-col gap-6 mb-8">
        <div className="flex flex-col gap-2">
          <label className="text-text-secondary text-[12px]">Amount to approve (USDT)</label>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00" 
            className="w-full bg-surface border border-border rounded-[10px] h-[52px] px-4 text-text-primary text-[14px] focus:outline-none focus:border-border-emphasis transition-colors"
          />
        </div>
      </div>

      <button 
        onClick={handleApprove}
        disabled={isProcessing || !amount}
        className="w-full h-[52px] bg-accent text-accent-text font-bold rounded-[10px] flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isProcessing ? "Processing..." : "Approve"}
      </button>
      
      <Link 
        href="/dashboard"
        className="w-full h-[52px] bg-transparent text-text-primary border border-border font-bold rounded-[10px] flex items-center justify-center hover:bg-surface transition-colors mt-4"
      >
        Skip for now
      </Link>
    </div>
  );
}

export default function ApproveAllowance() {
  return (
    <Suspense fallback={<div className="p-8 text-text-primary">Loading...</div>}>
      <ApproveContent />
    </Suspense>
  );
}
