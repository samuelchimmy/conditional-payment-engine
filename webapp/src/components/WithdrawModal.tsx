"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { ERC20ABI, USDTAddressCelo } from "@/lib/contracts";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");

  const { data: balanceData } = useReadContract({
    address: USDTAddressCelo,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: isOpen && !!address,
    }
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const formattedBalance = balanceData 
    ? parseFloat(formatUnits(balanceData as bigint, 6)).toFixed(2) 
    : "0.00";

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Reset form when opened
      setAmount("");
      setDestination("");
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleWithdraw = () => {
    if (!amount || !destination) return;
    writeContract({
      address: USDTAddressCelo,
      abi: ERC20ABI,
      functionName: "transfer",
      args: [destination, parseUnits(amount, 6)],
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="relative w-full max-w-[420px] bg-surface border border-border rounded-[16px] overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="h-[64px] border-b border-divider flex items-center justify-between px-6">
              <h2 className="text-text-primary text-[16px] font-bold">Withdraw USDT</h2>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-border transition-colors text-text-secondary hover:text-text-primary"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col gap-6">
              
              {/* Destination Address */}
              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-[12px]">Destination Address</label>
                <input 
                  type="text" 
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="0x..." 
                  className="w-full bg-surface border border-border rounded-[10px] h-[46px] px-4 text-text-primary text-[14px] focus:outline-none focus:border-border-emphasis transition-colors"
                />
              </div>

              {/* Amount */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-text-secondary text-[12px]">Amount</label>
                  <span className="text-text-muted text-[12px]">Balance: {formattedBalance}</span>
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00" 
                    className="w-full bg-surface border border-border rounded-[10px] h-[46px] pl-4 pr-16 text-text-primary text-[14px] focus:outline-none focus:border-border-emphasis transition-colors"
                  />
                  <div className="absolute right-4 top-0 bottom-0 flex items-center">
                    <span className="text-text-secondary font-bold text-[12px]">USDT</span>
                  </div>
                </div>

                <div className="flex gap-2 w-full mt-4">
                  <button 
                    onClick={() => {
                      if (!balanceData) return;
                      const bal = parseFloat(formatUnits(balanceData as bigint, 6));
                      setAmount((bal * 0.25).toFixed(2));
                    }}
                    className="flex-1 h-[32px] bg-transparent border border-border rounded-[6px] text-text-secondary text-[11px] font-bold hover:text-text-primary hover:border-border-emphasis hover:bg-[#151515] transition-colors"
                  >
                    25%
                  </button>
                  <button 
                    onClick={() => {
                      if (!balanceData) return;
                      const bal = parseFloat(formatUnits(balanceData as bigint, 6));
                      setAmount((bal * 0.50).toFixed(2));
                    }}
                    className="flex-1 h-[32px] bg-transparent border border-border rounded-[6px] text-text-secondary text-[11px] font-bold hover:text-text-primary hover:border-border-emphasis hover:bg-[#151515] transition-colors"
                  >
                    50%
                  </button>
                  <button 
                    onClick={() => {
                      if (!balanceData) return;
                      const bal = parseFloat(formatUnits(balanceData as bigint, 6));
                      setAmount((bal * 0.75).toFixed(2));
                    }}
                    className="flex-1 h-[32px] bg-transparent border border-border rounded-[6px] text-text-secondary text-[11px] font-bold hover:text-text-primary hover:border-border-emphasis hover:bg-[#151515] transition-colors"
                  >
                    75%
                  </button>
                  <button 
                    onClick={() => {
                      if (!balanceData) return;
                      setAmount(formattedBalance);
                    }}
                    className="flex-1 h-[32px] bg-transparent border border-border rounded-[6px] text-text-secondary text-[11px] font-bold hover:text-text-primary hover:border-border-emphasis hover:bg-[#151515] transition-colors"
                  >
                    Max
                  </button>
                </div>
              </div>

            </div>

            <div className="p-6 pt-2 border-t border-divider">
              <button 
                onClick={handleWithdraw}
                disabled={isPending || isConfirming || !amount || !destination}
                className="w-full h-[52px] bg-accent text-accent-text font-bold rounded-[10px] flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isPending || isConfirming ? "Processing..." : isSuccess ? "Success!" : "Confirm Withdrawal"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
