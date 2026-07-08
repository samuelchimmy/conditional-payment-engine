"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { useReadContract, useWatchContractEvent } from "wagmi";
import confetti from "canvas-confetti";
import { useWallet } from "@/components/WalletProvider";
import { playConfettiSound, playSuccessSound } from "@/lib/sounds";
import { ERC20ABI, USDTAddressCelo } from "@/lib/contracts";
import { formatUnits } from "viem";
import { QRCodeSVG } from "qrcode.react";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const { address } = useWallet();
  const [copied, setCopied] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState<string | null>(null);

  const [initialBalance, setInitialBalance] = useState<bigint | null>(null);

  const { data: currentBalance, refetch: refetchBalance } = useReadContract({
    address: USDTAddressCelo,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: isOpen && !!address,
      refetchInterval: 3000,
    }
  });

  useEffect(() => {
    if (isOpen && currentBalance !== undefined && initialBalance === null) {
      setInitialBalance(currentBalance as bigint);
    }
  }, [isOpen, currentBalance, initialBalance]);

  // Shared success trigger — fires from either the live Transfer event OR the balance poll.
  const triggerSuccess = useCallback((amountFormatted: string) => {
    setDepositSuccess((already) => {
      if (already) return already; // avoid double-firing
      setReceivedAmount(amountFormatted);
      playSuccessSound();
      playConfettiSound();
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#009393", "#F2F1EF", "#050505", "#181818"],
      });
      setTimeout(() => {
        onClose();
        setDepositSuccess(false);
        setReceivedAmount(null);
        setInitialBalance(null);
      }, 4000);
      return true;
    });
  }, [onClose]);

  // INSTANT detection: watch USDT Transfer events where `to` is our address.
  useWatchContractEvent({
    address: USDTAddressCelo,
    abi: ERC20ABI,
    eventName: "Transfer",
    args: address ? { to: address as `0x${string}` } : undefined,
    enabled: isOpen && !!address && !depositSuccess,
    onLogs: (logs) => {
      let total = BigInt(0);
      for (const log of logs) {
        const value = (log as any)?.args?.value as bigint | undefined;
        if (value) total += value;
      }
      if (total > BigInt(0)) {
        refetchBalance();
        triggerSuccess(formatUnits(total, 6));
      }
    },
  });

  // Fallback detection: balance poll (in case the live event is missed).
  useEffect(() => {
    if (isOpen && initialBalance !== null && currentBalance !== undefined && !depositSuccess) {
      const curr = currentBalance as bigint;
      if (curr > initialBalance) {
        triggerSuccess(formatUnits(curr - initialBalance, 6));
      }
    }
  }, [currentBalance, initialBalance, isOpen, depositSuccess, triggerSuccess]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setDepositSuccess(false);
      setReceivedAmount(null);
      setInitialBalance(null);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
            {/* Header */}
            {!depositSuccess && (
              <div className="h-[64px] border-b border-divider flex items-center justify-between px-6">
                <div className="flex flex-col">
                  <h2 className="text-text-primary text-[16px] font-bold leading-tight">Deposit</h2>
                  <span className="text-text-muted text-[12px] leading-tight mt-0.5">USDT on Celo</span>
                </div>
                <button 
                  onClick={onClose}
                  aria-label="Close"
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-border transition-colors text-text-secondary hover:text-text-primary"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}

            {/* Content */}
            <div className={`p-6 flex flex-col items-center ${depositSuccess ? 'py-12' : 'pb-4 gap-4'}`}>
              
              {depositSuccess ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center text-center gap-5 w-full"
                >
                  {/* Animated green success ring + drawn checkmark */}
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <motion.span
                      className="absolute inset-0 rounded-full bg-success/15"
                      initial={{ scale: 0.4, opacity: 0.8 }}
                      animate={{ scale: 1.35, opacity: 0 }}
                      transition={{ duration: 1.1, ease: "easeOut", repeat: 1 }}
                    />
                    <motion.div
                      className="w-20 h-20 rounded-full bg-success flex items-center justify-center shadow-[0_8px_30px_-6px_rgba(0,147,147,0.6)]"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    >
                      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#F2F1EF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <motion.polyline
                          points="20 6 9 17 4 12"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ delay: 0.18, duration: 0.4, ease: "easeInOut" }}
                        />
                      </svg>
                    </motion.div>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-success text-[30px] font-[800] leading-none tracking-tight"
                    >
                      +{receivedAmount ? parseFloat(receivedAmount).toFixed(2) : "0.00"} <span className="text-[18px] font-bold">USDT</span>
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.42 }}
                      className="text-text-secondary text-[13px] mt-1"
                    >
                      Deposit received
                    </motion.p>
                  </div>
                </motion.div>
              ) : (
                <>
              
              {/* Direct Deposit Row */}
              <div className="w-full flex flex-col rounded-[10px] overflow-hidden shadow-sm">
                <div className="w-full bg-surface border border-border-emphasis rounded-t-[10px] px-5 py-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-text-primary text-[14px] font-bold">Direct deposit</span>
                    <span className="text-text-muted text-[11px]">Send to your Celo address</span>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-text-primary transform rotate-90 transition-transform">
                    <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* QR Code Expansion Panel */}
                <div className="w-full bg-[#050505] border-x border-b border-border-emphasis p-6 flex flex-col items-center rounded-b-[10px]">
                  <div className="w-[140px] h-[140px] bg-white p-2 rounded-[10px] mb-4 relative flex items-center justify-center">
                    <QRCodeSVG value={address || "CeloDeposit"} size={124} fgColor="#000" bgColor="#fff" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-[0_0_0_4px_white] overflow-hidden">
                        <img src="/tether-qr-logo.png" alt="Tether" className="h-8 w-8 object-contain" />
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleCopy}
                    className="font-mono text-text-primary text-[13px] tracking-wide mb-2 hover:text-text-muted transition-colors"
                  >
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}
                  </button>
                  
                  <button 
                    onClick={handleCopy}
                    className="text-text-secondary text-[12px] underline underline-offset-4 hover:text-text-primary transition-colors mb-4"
                  >
                    {copied ? "Copied!" : "Copy address"}
                  </button>
                  
                  <span className="text-text-muted text-[11px]">Min 1 USDT · Celo network</span>
                </div>
              </div>

              {/* Bridge Row */}
              <button className="w-full bg-surface border border-border rounded-[10px] px-5 py-4 flex items-center justify-between hover:border-border-emphasis transition-colors">
                <div className="flex flex-col items-start text-left">
                  <span className="text-text-primary text-[14px] font-bold">Bridge from another chain</span>
                  <span className="text-text-muted text-[12px]">Ethereum, Base, Arbitrum, Polygon</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-text-secondary">
                  <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              </>
              )}

            </div>

            {/* Footer / CTA */}
            {!depositSuccess && (
              <div className="p-6 pt-2">
                <button 
                  onClick={onClose}
                  className="w-full h-[52px] bg-accent text-accent-text font-bold rounded-[10px] flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  I have sent funds
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
