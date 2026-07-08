"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import confetti from "canvas-confetti";
import { ERC20ABI, USDTAddressCelo } from "@/lib/contracts";
import { useWallet } from "@/components/WalletProvider";
import { useSendTx } from "@/lib/sendTx";
import { friendlyTxError } from "@/lib/txError";
import { playSuccessSound, playConfettiSound } from "@/lib/sounds";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
  const { address } = useWallet(); // was useAccount() — empty for WDK/Google wallets
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: balanceData } = useReadContract({
    address: USDTAddressCelo,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: isOpen && !!address,
    }
  });

  const { sendTx } = useSendTx();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [isPending, setIsPending] = useState(false);
  const [sentAmount, setSentAmount] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // Fire the success animation once the withdrawal transaction confirms on-chain.
  useEffect(() => {
    if (isSuccess && txHash) {
      playSuccessSound();
      playConfettiSound();
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#009393", "#F2F1EF", "#050505", "#181818"],
      });
      const t = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [isSuccess, txHash, onClose]);

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
      setErrorMsg(null);
      setTxHash(undefined);
      setSentAmount(null);
      setSentTo(null);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleWithdraw = async () => {
    if (!amount || !destination) return;
    if (!/^0x[a-fA-F0-9]{40}$/.test(destination.trim())) {
      setErrorMsg("Enter a valid destination address (0x…).");
      return;
    }
    try {
      setErrorMsg(null);
      setIsPending(true);
      const h = await sendTx({
        address: USDTAddressCelo,
        abi: ERC20ABI,
        functionName: "transfer",
        args: [destination as `0x${string}`, parseUnits(amount, 6)],
      });
      setSentAmount(amount);
      setSentTo(destination);
      setTxHash(h);
    } catch (e) {
      console.error(e);
      setErrorMsg(friendlyTxError(e));
    } finally {
      setIsPending(false);
    }
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
            {isSuccess ? (
              /* Success state — checkmark + amount + recipient in tether green */
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center justify-center text-center gap-4 w-full py-12 px-6"
              >
                <div className="w-20 h-20 rounded-full bg-success text-[#F2F1EF] flex items-center justify-center mb-2">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h2 className="text-success text-[20px] font-[800]">Sent!</h2>
                <p className="text-text-secondary text-[13px]">
                  {sentAmount ? `${parseFloat(sentAmount).toFixed(2)} USDT` : "Your USDT"} sent to{" "}
                  <span className="text-text-primary font-semibold font-mono">
                    {sentTo ? `${sentTo.slice(0, 6)}...${sentTo.slice(-4)}` : "recipient"}
                  </span>
                </p>
              </motion.div>
            ) : (
            <>
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
                {isPending || isConfirming ? "Processing..." : "Confirm Withdrawal"}
              </button>
              {errorMsg && (
                <p className="text-[12px] text-red-400 text-center mt-3 break-words">{errorMsg}</p>
              )}
            </div>
            </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
