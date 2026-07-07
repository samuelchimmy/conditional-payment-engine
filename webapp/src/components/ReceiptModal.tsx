import { useState } from "react";

export function ReceiptModal({ isOpen, onClose, bet }: { isOpen: boolean; onClose: () => void; bet: any }) {
  if (!isOpen || !bet) return null;

  const amount = parseFloat(bet.amount || 0);
  const fee = amount * 0.006; 
  const net = amount - fee;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      
      <div className="w-full max-w-[420px] bg-[#F2F1EF] rounded-[16px] p-8 text-[#050505] shadow-lg relative animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        <div className="flex justify-center mb-8">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-baseline gap-0.5">
              <span className="font-[800] text-[#050505] text-[20px] tracking-tight">tether</span>
              <span className="font-[800] text-[#797977] text-[20px]">.</span>
              <span className="font-[400] text-[#050505] text-[20px] tracking-tight">arena</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <span className="text-[#797977] text-[10px] font-normal uppercase tracking-[0.1em]">
            RECEIPT
          </span>
          <h1 className="text-[#050505] text-[36px] font-[800] leading-none mt-2 mb-2 tracking-tight">
            Transaction Details
          </h1>
          <p className="text-[#797977] text-[14px]">
            {bet.condition_str} · {amount.toFixed(2)} {bet.currency || 'USDT'}
          </p>
        </div>

        <div className="mb-6 bg-[#E2E1DF] p-4 rounded-[10px] text-[13px] font-mono flex flex-col gap-2 border border-[#D1D1D1]">
          <div className="flex justify-between">
            <span className="text-[#797977]">Sender:</span>
            <span className="font-bold">{bet.sender_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#797977]">Receiver:</span>
            <span className="font-bold">{bet.recipient_handle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#797977]">Platform:</span>
            <span className="font-bold capitalize">{bet.platform}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#797977]">Status:</span>
            <span className="font-bold capitalize">{bet.status}</span>
          </div>
        </div>

        <div className="mb-8 flex flex-col gap-1 text-[15px] font-mono font-bold">
          <div className="flex justify-between">
            <span className="font-normal">Amount:</span>
            <span>{amount.toFixed(2)} USDT</span>
          </div>
          <div className="flex justify-between">
            <span className="font-normal">Fee:</span>
            <span>{fee.toFixed(2)} USDT</span>
          </div>
          <div className="flex justify-between border-t border-[#1A1A1A] pt-1 mt-1">
            <span className="font-normal">Net:</span>
            <span>{net.toFixed(2)} USDT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
