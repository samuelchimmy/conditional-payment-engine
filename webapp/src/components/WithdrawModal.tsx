"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
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
              <h2 className="text-text-primary text-[18px] font-bold">Withdraw USDT</h2>
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
                <label className="text-text-secondary text-[13px]">Destination Address</label>
                <input 
                  type="text" 
                  placeholder="0x..." 
                  className="w-full bg-surface border border-border rounded-[10px] h-[52px] px-4 text-text-primary text-[15px] focus:outline-none focus:border-border-emphasis transition-colors"
                />
              </div>

              {/* Amount */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-text-secondary text-[13px]">Amount</label>
                  <span className="text-text-muted text-[13px]">Balance: 0.00</span>
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    className="w-full bg-surface border border-border rounded-[10px] h-[52px] pl-4 pr-16 text-text-primary text-[15px] focus:outline-none focus:border-border-emphasis transition-colors"
                  />
                  <div className="absolute right-4 top-0 bottom-0 flex items-center">
                    <span className="text-text-secondary font-bold text-[13px]">USDT</span>
                  </div>
                </div>

                {/* Quick Amounts */}
                <div className="flex items-center gap-2 mt-1">
                  {["25%", "50%", "75%", "Max"].map((amt) => (
                    <button 
                      key={amt}
                      className="flex-1 h-[32px] bg-transparent border border-border rounded-[6px] text-text-secondary text-[12px] font-bold hover:text-text-primary hover:border-border-emphasis hover:bg-[#151515] transition-colors"
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer / CTA */}
            <div className="p-6 pt-2 border-t border-divider">
              <button 
                onClick={onClose}
                className="w-full h-[52px] bg-accent text-accent-text font-bold rounded-[10px] flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                Confirm Withdrawal
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
