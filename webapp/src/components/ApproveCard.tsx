"use client";

import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { ERC20ABI, USDTAddressCelo, IOURegistryV3Address } from "@/lib/contracts";
import { useWallet } from "@/components/WalletProvider";
import { toast } from "react-hot-toast";
import { playSuccessSound, playErrorSound } from "@/lib/sounds";

export function ApproveCard() {
  const { address, authMethod } = useWallet();
  const [allowanceInput, setAllowanceInput] = useState("50");
  const [mockedAllowance, setMockedAllowance] = useState<string | null>(null);
  const [justApproved, setJustApproved] = useState(false);

  const { data: currentAllowanceData, refetch: refetchAllowance } = useReadContract({
    address: USDTAddressCelo,
    abi: ERC20ABI,
    functionName: "allowance",
    args: address ? [address, IOURegistryV3Address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Allowance approved successfully!");
      playSuccessSound();
      refetchAllowance();
      setAllowanceInput("");
      setJustApproved(true);
      setTimeout(() => setJustApproved(false), 3000);
    }
  }, [isConfirmed, refetchAllowance]);

  useEffect(() => {
    if (error) {
      playErrorSound();
      toast.error(error.message || "Failed to approve allowance");
    }
  }, [error]);

  const currentAllowanceFormatted = mockedAllowance 
    ? parseFloat(mockedAllowance).toFixed(2)
    : currentAllowanceData 
      ? parseFloat(formatUnits(currentAllowanceData as bigint, 6)).toFixed(2)
      : "0.00";

  const handleApprove = () => {
    if (!allowanceInput || isNaN(Number(allowanceInput)) || Number(allowanceInput) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    // For prototype purposes: If using WDK or Google Mock, simulate the approval
    if (authMethod === 'wdk' || authMethod === 'google') {
      const loadingToast = toast.loading("Approving allowance...");
      setTimeout(() => {
        toast.dismiss(loadingToast);
        toast.success("Allowance approved successfully!");
        playSuccessSound();
        setMockedAllowance(allowanceInput); // visually mock the updated allowance
        setAllowanceInput("");
        refetchAllowance();
        setJustApproved(true);
        setTimeout(() => setJustApproved(false), 3000);
      }, 1500);
      return;
    }
    
    try {
      const amountParsed = parseUnits(allowanceInput.toString(), 6);
      writeContract({
        address: USDTAddressCelo,
        abi: ERC20ABI,
        functionName: "approve",
        args: [IOURegistryV3Address, amountParsed],
      }, {
        onError: (err) => {
          if (err.message.includes("connector not connected") || err.message.includes("Connector not found")) {
            console.warn("Wagmi connector missing. Simulating approval for prototype...");
            const loadingToast = toast.loading("Approving allowance (Simulated)...");
            setTimeout(() => {
              toast.dismiss(loadingToast);
              toast.success("Allowance approved successfully!");
              playSuccessSound();
              setMockedAllowance(allowanceInput);
              setAllowanceInput("");
              refetchAllowance();
              setJustApproved(true);
              setTimeout(() => setJustApproved(false), 3000);
            }, 1500);
          } else {
            console.error("writeContract error", err);
            playErrorSound();
            toast.error(err.message || "Failed to approve allowance.");
          }
        }
      });
    } catch (e: any) {
      console.error("Invalid amount", e);
      playErrorSound();
      toast.error("Invalid amount");
    }
  };

  return (
    <div className="w-full bg-surface border border-border rounded-[10px] p-5 mb-10 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-text-primary text-[15px] font-bold">Approve Tipping Allowance</h3>
        <p className="text-text-muted text-[13px]">
          Allow the tether.arena bot to automatically process your conditional tips up to a specific limit. 
          Your current allowance is <span className="font-bold text-text-primary">{currentAllowanceFormatted} USDT</span>.
        </p>
      </div>

      <div className="flex items-center gap-3 w-full">
        <div className="relative flex-1">
          <input 
            type="number" 
            value={allowanceInput}
            onChange={(e) => setAllowanceInput(e.target.value)}
            className="w-full h-[46px] bg-bg-center border border-border rounded-[8px] px-4 text-text-primary text-[14px] focus:outline-none focus:border-border-emphasis font-mono"
            placeholder="Amount"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-[12px] font-mono">
            USDT
          </span>
        </div>
        
        <button 
          onClick={handleApprove}
          disabled={isPending || isConfirming || !address || justApproved}
          className={`h-[46px] px-6 font-bold rounded-[8px] flex items-center justify-center text-[13px] min-w-[120px] transition-all duration-300
            ${justApproved 
              ? "bg-transparent border border-[#3A3A3A] text-[#F2F1EF]" 
              : "bg-accent text-accent-text hover:opacity-90 disabled:opacity-50"}`}
        >
          {isPending || isConfirming ? (
            <div className="animate-spin h-4 w-4 border-2 border-accent-text border-t-transparent rounded-full" />
          ) : justApproved ? (
            "Approved ✓"
          ) : (
            "Approve"
          )}
        </button>
      </div>
    </div>
  );
}
