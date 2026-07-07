"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useWallet } from "@/components/WalletProvider";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Receipt() {
  const { address } = useWallet();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  
  const [bet, setBet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchBet = async () => {
      try {
        const { data, error } = await supabase
          .from("conditional_payments")
          .select("*")
          .eq("id", id)
          .single();
          
        if (error) throw error;
        setBet(data);
      } catch (err) {
        console.error("Failed to fetch bet:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBet();
  }, [id]);

  if (loading) {
    return (
      <div className="w-full flex justify-center pt-8">
        <div className="animate-spin h-6 w-6 border-2 border-text-secondary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!bet) {
    return (
      <div className="w-full flex justify-center pt-8">
        <div className="text-center text-text-muted">
          <p>Transaction not found.</p>
          <Link href="/dashboard" className="text-accent underline mt-4 block">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  const amount = parseFloat(bet.amount || 0);
  const fee = amount * 0.006; 
  const net = amount - fee;

  return (
    <div className="w-full flex justify-center pt-4 pb-12">
      <div className="w-full max-w-[420px] bg-[#F2F1EF] rounded-[16px] p-8 text-[#050505] shadow-lg">
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

        <div className="flex flex-col gap-3">
          <Link href="/dashboard" className="w-full h-[52px] bg-transparent text-[#050505] text-[15px] font-bold rounded-[10px] flex items-center justify-center border border-[#050505] hover:bg-[#E2E1DF] transition-colors">
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
