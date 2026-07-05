"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DepositModal({ isOpen, onClose }: DepositModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

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
              <div className="flex flex-col">
                <h2 className="text-text-primary text-[18px] font-bold leading-tight">Deposit</h2>
                <span className="text-text-muted text-[13px] leading-tight mt-0.5">USDT on Celo</span>
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

            {/* Content */}
            <div className="p-6 pb-4 flex flex-col gap-4">
              
              {/* Direct Deposit Row */}
              <div className="w-full flex flex-col rounded-[10px] overflow-hidden shadow-sm">
                <div className="w-full bg-surface border border-border-emphasis rounded-t-[10px] px-5 py-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-text-primary text-[15px] font-bold">Direct deposit</span>
                    <span className="text-text-muted text-[13px]">Send to your Celo address</span>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-text-primary transform rotate-90 transition-transform">
                    <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* QR Code Expansion Panel */}
                <div className="w-full bg-[#050505] border-x border-b border-border-emphasis p-6 flex flex-col items-center rounded-b-[10px]">
                  <div className="w-[140px] h-[140px] bg-white p-2 rounded-[10px] mb-4 flex items-center justify-center">
                    {/* Placeholder QR Code image. Typically you'd use a real library or image here */}
                    <div className="w-full h-full border-4 border-black border-dashed flex items-center justify-center text-black font-bold text-[12px]">QR CODE</div>
                  </div>
                  
                  <span className="font-mono text-text-primary text-[16px] tracking-wide mb-2">0x4f2a...8c3b</span>
                  
                  <button className="text-text-secondary text-[13px] underline underline-offset-4 hover:text-text-primary transition-colors mb-4">
                    Copy address
                  </button>
                  
                  <span className="text-text-muted text-[12px]">Min 1 USDT · Celo network</span>
                </div>
              </div>

              {/* Bridge Row */}
              <button className="w-full bg-surface border border-border rounded-[10px] px-5 py-4 flex items-center justify-between hover:border-border-emphasis transition-colors">
                <div className="flex flex-col items-start text-left">
                  <span className="text-text-primary text-[15px] font-bold">Bridge from another chain</span>
                  <span className="text-text-muted text-[13px]">Ethereum, Base, Arbitrum, Polygon</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-text-secondary">
                  <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

            </div>

            {/* Footer / CTA */}
            <div className="p-6 pt-2">
              <button 
                onClick={onClose}
                className="w-full h-[52px] bg-accent text-accent-text font-bold rounded-[10px] flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                I have sent funds
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
