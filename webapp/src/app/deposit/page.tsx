"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";

export default function Deposit() {
  const router = useRouter();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const simulateDeposit = () => {
    // Show success modal
    setShowSuccessModal(true);
    
    // Fire dark orange, white, and black confetti
    const colors = ["#D53131", "#F2F1EF", "#000000"];
    
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors,
      disableForReducedMotion: true
    });

    // Automatically transition to next screen after 2.5 seconds
    setTimeout(() => {
      router.push("/approve");
    }, 2500);
  };

  return (
    <div className="w-full max-w-[440px] flex flex-col pt-8 relative">
      <div className="mb-6 text-center sm:text-left">
        <h1 className="text-text-primary text-[28px] font-[800]">
          Add funds
        </h1>
        <p className="text-text-muted text-[14px] mt-2">
          USDT on Celo
        </p>
      </div>

      <div className="flex flex-col gap-4 mb-4">
        {/* Direct Deposit Row */}
        <div className="w-full flex flex-col rounded-[10px] overflow-hidden shadow-sm">
          <div className="w-full bg-surface border border-border-emphasis rounded-t-[10px] px-5 py-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-text-primary text-[15px] font-bold">Direct deposit</span>
              <span className="text-text-muted text-[12px]">Send to your Celo address</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-text-primary transform rotate-90 transition-transform">
              <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* QR Code Expansion Panel */}
          <div className="w-full bg-[#050505] border-x border-b border-border-emphasis p-6 flex flex-col items-center rounded-b-[10px]">
            <div className="w-[140px] h-[140px] bg-white p-2 rounded-[10px] mb-4 relative flex items-center justify-center">
              {/* This represents a QR code for the Celo address */}
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=CeloDeposit`} alt="QR Code" className="w-full h-full" />
              
              {/* Logo superimposed in the center */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white rounded-full p-1 shadow-sm">
                  <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                </div>
              </div>
            </div>
            
            <span className="font-mono text-text-primary text-[15px] tracking-wide mb-2">0x4f2a...8c3b</span>
            
            <button className="text-text-secondary text-[12px] underline underline-offset-4 hover:text-text-primary transition-colors mb-4">
              Copy address
            </button>
            
            <span className="text-text-muted text-[11px]">Min 1 USDT · Celo network</span>
          </div>
        </div>

        {/* Bridge Row */}
        <button className="w-full bg-surface border border-border rounded-[10px] px-5 py-4 flex items-center justify-between hover:border-border-emphasis transition-colors">
          <div className="flex flex-col items-start text-left">
            <span className="text-text-primary text-[15px] font-bold">Bridge from another chain</span>
            <span className="text-text-muted text-[12px]">Ethereum, Base, Arbitrum, Polygon</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-text-secondary">
            <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <button 
        onClick={simulateDeposit}
        className="w-full h-[52px] bg-transparent text-text-primary border border-border font-bold rounded-[10px] flex items-center justify-center hover:bg-surface transition-colors mt-2"
      >
        Simulate Deposit Received
      </button>

      {/* Success Modal Overlay */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-surface border border-border-emphasis p-8 rounded-[16px] flex flex-col items-center justify-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-[#009393]/20 flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#009393]">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-text-primary text-[20px] font-bold mb-2">Deposit Received!</h2>
            <p className="text-text-muted text-[14px]">You are ready to proceed.</p>
          </div>
        </div>
      )}
    </div>
  );
}
