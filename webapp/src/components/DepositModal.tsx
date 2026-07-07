"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useAccount, useWatchContractEvent } from "wagmi";
import confetti from "canvas-confetti";
import { ERC20ABI, USDTAddressCelo } from "@/lib/contracts";
import { formatUnits } from "viem";
import { QRCodeSVG } from "qrcode.react";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const { address } = useAccount();
  const [copied, setCopied] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState<string | null>(null);

  // Watch for incoming USDT transfers
  useWatchContractEvent({
    address: USDTAddressCelo,
    abi: ERC20ABI,
    eventName: "Transfer",
    args: {
      to: address,
    },
    onLogs(logs) {
      if (!isOpen || !logs || logs.length === 0) return;
      
      const log = logs[0] as any;
      if (log && log.args && log.args.amount) {
        const amountFormatted = formatUnits(log.args.amount, 6);
        setReceivedAmount(amountFormatted);
      }

      setDepositSuccess(true);
      
      // Trigger dark orange/white/black confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D53131', '#F2F1EF', '#050505', '#181818']
      });

      // Auto close after 4 seconds
      setTimeout(() => {
        onClose();
        setDepositSuccess(false);
        setReceivedAmount(null);
      }, 4000);
    },
  });

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setDepositSuccess(false);
      setReceivedAmount(null);
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
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center justify-center text-center gap-4 w-full"
                >
                  <div className="w-20 h-20 rounded-full bg-accent text-accent-text flex items-center justify-center mb-2">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <h2 className="text-text-primary text-[20px] font-[800]">Deposit Detected!</h2>
                  <p className="text-text-secondary text-[13px]">
                    {receivedAmount ? `Successfully received ${parseFloat(receivedAmount).toFixed(2)} USDT` : "Your funds have arrived."}
                  </p>
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
