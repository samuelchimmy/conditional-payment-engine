"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSignMessage } from "wagmi";
import { useWallet } from "@/components/WalletProvider";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Claim() {
  const { address } = useWallet();
  const { signMessageAsync } = useSignMessage();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  
  const [bet, setBet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null);

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

  const handleClaim = async () => {
    if (!address) {
      setResult({ success: false, message: "Please connect your wallet first." });
      return;
    }
    if (!bet) return;

    setClaiming(true);
    setResult(null);

    try {
      const message = `Claim IOUs for ${address} at ${new Date().toISOString()}`;
      const signature = await signMessageAsync({ message });

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) throw new Error("Supabase URL not configured");

      const res = await fetch(`${supabaseUrl}/functions/v1/secure-claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: "claim-single", // or claim-all depending on backend support, let's keep it abstract or use the backend logic
          betId: bet.id,
          walletAddress: address,
          message,
          signature
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to claim IOUs");
      }

      setResult({ success: true, message: data.message || "Claim successful!" });
      
      // update local state
      setBet({ ...bet, status: "claimed" });
    } catch (error: any) {
      console.error("Claim Error:", error);
      setResult({ success: false, message: error.message || "An error occurred during claiming." });
    } finally {
      setClaiming(false);
    }
  };

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
          <p>Bet not found or invalid ID.</p>
          <Link href="/dashboard" className="text-accent underline mt-4 block">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  const amount = parseFloat(bet.amount || 0);
  const fee = amount * 0.006; // 0.6% or whatever the fee is, the image shows 50.00 -> 0.30 fee
  const net = amount - fee;

  return (
    <div className="w-full flex justify-center pt-4 pb-12">
      {/* Light Theme Card for Claiming */}
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
            CLAIM · STEP 1 OF 2
          </span>
          <h1 className="text-[#050505] text-[36px] font-[800] leading-none mt-2 mb-2 tracking-tight">
            You won.
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
        </div>

        <div className="mb-6 flex flex-col gap-1 text-[15px] font-mono font-bold">
          <div className="flex justify-between">
            <span className="font-normal">You receive:</span>
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

        {result && (
          <div className={`mb-6 p-4 rounded-[10px] text-[13px] font-bold ${result.success ? 'bg-[#D1FADF] text-[#027A48]' : 'bg-[#FEE4E2] text-[#B42318]'}`}>
            {result.message}
          </div>
        )}

        {bet.status === "pending" ? (
          <>
            <div className="flex flex-col mb-4">
              <label className="text-[#797977] text-[13px] mb-2">Send to</label>
              <input 
                type="text" 
                placeholder="MagicPay link or wallet address"
                value={address || ""}
                readOnly
                className="w-full h-[52px] bg-[#050505] text-[#F2F1EF] border border-[#2A2A2A] rounded-[10px] px-4 text-[14px]"
              />
            </div>
            
            <p className="text-[#050505] text-[14px] mb-4 text-center font-medium">
              Or claim directly to your connected wallet.
            </p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleClaim}
                disabled={claiming || !address}
                className="w-full h-[52px] bg-[#D53131] text-[#000000] text-[15px] font-bold rounded-[10px] flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {claiming ? (
                  <div className="animate-spin h-5 w-5 border-2 border-[#000000] border-t-transparent rounded-full" />
                ) : (
                  `Claim ${net.toFixed(2)} USDT`
                )}
              </button>
              
              <button className="w-full h-[52px] bg-transparent text-[#050505] text-[15px] font-bold rounded-[10px] flex items-center justify-center border border-[#050505] hover:bg-[#E2E1DF] transition-colors">
                Request refund instead
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3 mt-8">
            <div className="w-full h-[52px] bg-[#D1FADF] text-[#027A48] text-[15px] font-bold rounded-[10px] flex items-center justify-center">
              Claimed Successfully
            </div>
            <Link href="/dashboard" className="w-full h-[52px] bg-transparent text-[#050505] text-[15px] font-bold rounded-[10px] flex items-center justify-center border border-[#050505] hover:bg-[#E2E1DF] transition-colors">
              Return to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
