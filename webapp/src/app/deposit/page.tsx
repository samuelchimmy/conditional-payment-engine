"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { useWallet } from "@/components/WalletProvider";
import { QRCodeSVG } from "qrcode.react";

export default function Deposit() {
  const { address } = useWallet();
  const router = useRouter();

  return (
    <div className="w-full max-w-[320px] flex flex-col pt-8 relative mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-text-primary text-[22px] font-[800]">
          Add funds
        </h1>
        <p className="text-text-muted text-[13px] mt-2">
          USDT on Celo
        </p>
      </div>

      <div className="flex flex-col gap-4 mb-4">
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
              {/* Logo superimposed in the center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center shadow-[0_0_0_4px_white]">
                  <img src="/tether-logo.svg" alt="Tether" className="h-4 w-4" />
                </div>
              </div>
            </div>
            
            <span className="font-mono text-text-primary text-[13px] tracking-wide mb-2">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not Connected"}</span>
            
            <button 
              onClick={() => { if (address) navigator.clipboard.writeText(address); }}
              className="text-text-secondary text-[12px] underline underline-offset-4 hover:text-text-primary transition-colors mb-4"
            >
              Copy address
            </button>
            
            <span className="text-text-muted text-[11px]">Min 1 USDT · Celo network</span>
          </div>
        </div>

        {/* Bridge Row */}
        <button className="w-full bg-surface border border-border rounded-[10px] px-5 py-4 flex items-center justify-between hover:border-border-emphasis transition-colors">
          <div className="flex flex-col items-start text-left">
            <span className="text-text-primary text-[14px] font-bold">Bridge from another chain</span>
            <span className="text-text-muted text-[11px]">Ethereum, Base, Arbitrum, Polygon</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-text-secondary">
            <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Deposit Later Button */}
        <button 
          onClick={() => router.push('/dashboard')}
          className="w-full h-[52px] bg-transparent border border-border text-text-primary font-bold rounded-[10px] hover:border-border-emphasis transition-colors mt-2 text-[14px]"
        >
          Deposit later
        </button>
      </div>
    </div>
  );
}
