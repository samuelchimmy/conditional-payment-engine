"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseUnits, formatUnits, keccak256, toHex } from "viem";
import { ERC20ABI, IOURegistryV3ABI, USDTAddressCelo, IOURegistryV3Address } from "@/lib/contracts";

export default function PlaceBet() {
  const { address } = useAccount();
  const [query, setQuery] = useState("");
  const [amount, setAmount] = useState("");
  const [counterparty, setCounterparty] = useState("");
  const [conditionId, setConditionId] = useState<`0x${string}`>("0x0");

  useEffect(() => {
    // Generate a random conditionId on load
    setConditionId(keccak256(toHex(Date.now().toString() + Math.random().toString())));
  }, []);

  const { data: balanceData } = useReadContract({
    address: USDTAddressCelo,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { writeContractAsync, isPending } = useWriteContract();
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const formattedBalance = balanceData 
    ? parseFloat(formatUnits(balanceData as bigint, 6)).toFixed(2) 
    : "0.00";

  const handleLockFunds = async () => {
    if (!amount || !counterparty || !query) return;
    try {
      setIsProcessing(true);
      const amountParsed = parseUnits(amount, 6);
      
      // 1. Approve
      await writeContractAsync({
        address: USDTAddressCelo,
        abi: ERC20ABI,
        functionName: "approve",
        args: [IOURegistryV3Address, amountParsed],
      });

      // 2. Create Condition
      await writeContractAsync({
        address: IOURegistryV3Address,
        abi: IOURegistryV3ABI,
        functionName: "createCondition",
        args: [conditionId, query, USDTAddressCelo, amountParsed, counterparty],
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
      <div className="w-full max-w-[480px] flex flex-col pt-12 items-center text-center">
        <div className="w-16 h-16 rounded-full bg-accent text-accent-text flex items-center justify-center mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h1 className="text-text-primary text-[28px] font-[800]">Funds Locked!</h1>
        <p className="text-text-muted mt-2 mb-8">The AI agent will now monitor the match outcome and settle automatically.</p>
        <Link href="/dashboard" className="w-full h-[52px] bg-surface border border-border text-text-primary font-bold rounded-[10px] flex items-center justify-center hover:bg-border transition-colors">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[480px] flex flex-col pt-12">
      <div className="mb-8">
        <span className="text-text-secondary text-[10px] font-normal uppercase tracking-[0.1em]">
          PLACE BET · 1 OF 3
        </span>
        <h1 className="text-text-primary text-[28px] font-[800] mt-2">
          What's the bet?
        </h1>
      </div>

      <div className="flex flex-col gap-6">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-[140px] bg-surface border border-border rounded-[10px] p-5 text-text-primary text-[14px] resize-none focus:outline-none focus:border-border-emphasis transition-colors"
          placeholder="e.g. Argentina wins the 2026 World Cup final"
        />

        <div className="flex gap-4">
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-text-secondary text-[11px]">Amount (USDT) · Bal: {formattedBalance}</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-[52px] bg-surface border border-border rounded-[10px] px-4 text-text-primary text-[14px] focus:outline-none focus:border-border-emphasis transition-colors"
            />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-text-secondary text-[11px]">Their wallet address</label>
            <input
              type="text"
              value={counterparty}
              onChange={(e) => setCounterparty(e.target.value)}
              placeholder="0x..."
              className="w-full h-[52px] bg-surface border border-border rounded-[10px] px-4 text-text-primary text-[14px] focus:outline-none focus:border-border-emphasis transition-colors"
            />
          </div>
        </div>

        <div className="w-full h-[1px] bg-divider my-2"></div>

        <div className="flex flex-col gap-2 font-mono text-[13px] mb-4">
          <div className="flex justify-between">
            <span className="text-text-secondary">Lock:</span>
            <span className="text-text-primary">{amount || "0"} USDT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Condition:</span>
            <span className="text-text-primary truncate ml-4 max-w-[200px]">{query || "..."}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Recipient:</span>
            <span className="text-text-primary">{counterparty ? `${counterparty.slice(0, 6)}...${counterparty.slice(-4)}` : "..."}</span>
          </div>
        </div>

        <button 
          onClick={handleLockFunds}
          disabled={!amount || !counterparty || !query || isProcessing}
          className="w-full h-[52px] bg-accent text-accent-text font-bold rounded-[10px] flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isProcessing ? "Processing (Approve & Lock)..." : "Review and Lock Funds"}
        </button>
      </div>
    </div>
  );
}
