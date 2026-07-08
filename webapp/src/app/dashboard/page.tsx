"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Accordion } from "@/components/Accordion";
import { WithdrawModal } from "@/components/WithdrawModal";
import { DepositModal } from "@/components/DepositModal";
import { SettingsModal } from "@/components/SettingsModal";
import { ClaimModal } from "@/components/ClaimModal";
import { ReceiptModal } from "@/components/ReceiptModal";
import { ApproveCard } from "@/components/ApproveCard";
import { SocialLinkingCard } from "@/components/SocialLinkingCard";
import { useReadContract } from "wagmi";
import { useWallet } from "@/components/WalletProvider";
import { ERC20ABI, USDTAddressCelo } from "@/lib/contracts";
import { formatUnits } from "viem";
import { playSuccessSound } from "@/lib/sounds";
import { toast } from "react-hot-toast";
import { getBets } from "@/lib/dbProxy";
import { useOnchainHistory } from "@/lib/useOnchainHistory";

export default function Dashboard() {
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [bets, setBets] = useState<any[]>([]);
  const [selectedClaimBet, setSelectedClaimBet] = useState<any | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);
  const [historyTab, setHistoryTab] = useState<"all" | "bets" | "transfers">("all");

  const { address, isConnected } = useWallet();
  const { transfers } = useOnchainHistory(address);

  // Merge bets + on-chain deposits/withdrawals into one time-sorted feed.
  const historyItems = [
    ...bets.map((b) => ({
      ...b,
      kind: b.isRecipient ? "bet_received" : "bet_sent",
      _ts: b.created_at ? new Date(b.created_at).getTime() : 0,
    })),
    ...transfers.map((t) => ({ ...t, _ts: t.timestamp ?? 0 })),
  ].sort((a, b) => b._ts - a._ts);

  const fetchBets = async () => {
    if (!address) return;
    const { data, error } = await getBets(address);
    if (error) {
      console.error("[Dashboard] Failed to fetch bets:", error);
      return;
    }
    // db-proxy already decorates with isRecipient
    setBets(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    if (!address) return;
    fetchBets();
  }, [address]);

  const { data: balanceData } = useReadContract({
    address: USDTAddressCelo,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
    }
  });

  const formattedBalance = balanceData 
    ? parseFloat(formatUnits(balanceData as bigint, 6)).toFixed(2) 
    : "0.00";

  return (
    <div className="w-full max-w-[640px] flex flex-col pt-4">
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
      />

      {/* Top Header: Address & Settings */}
      <div className="flex flex-col mb-8">
        <span className="text-text-secondary text-[10px] font-normal uppercase tracking-[0.1em] mb-4">
          DASHBOARD / MY BETS
        </span>
        <div className="flex items-center justify-between">
          <span 
            onClick={() => {
              if (!address) return;
              navigator.clipboard.writeText(address);
              toast.success("Address copied!");
              playSuccessSound();
            }}
            className="font-mono text-[12px] text-text-primary bg-surface px-4 py-2 rounded-[8px] border border-border inline-flex items-center gap-2 cursor-pointer hover:border-border-emphasis transition-colors"
          >
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}></span>
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not Connected"}
          </span>
          
          <button 
            onClick={() => setIsSettingsModalOpen(true)}
            className="w-[36px] h-[36px] flex items-center justify-center rounded-[8px] border border-border hover:bg-surface transition-colors text-text-primary"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Balance Card & Buttons (Mobile Layout on all devices) */}
      <div className="flex flex-col items-start w-full mb-12">
        <div className="bg-surface border border-border rounded-[10px] px-6 py-4 flex items-center justify-between mb-3 w-full">
          <div className="flex flex-col">
            <span className="text-text-secondary text-[11px] uppercase tracking-wider mb-1">Balance</span>
            <span className="text-text-primary text-[20px] font-[800] tracking-tight">{formattedBalance} <span className="text-text-secondary text-[13px] font-normal">USDT</span></span>
          </div>
          <button 
            onClick={() => setIsHistorySheetOpen(true)}
            className="flex flex-col items-center justify-center text-text-secondary hover:text-text-primary transition-colors shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v5h5"></path>
              <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path>
              <path d="M12 7v5l4 2"></path>
            </svg>
            <span className="text-[10px] mt-1 font-bold">History</span>
          </button>
        </div>
        <div className="flex items-center gap-3 w-full mb-6">
          <button 
            onClick={() => setIsWithdrawModalOpen(true)}
            className="flex-1 h-[40px] px-6 bg-transparent border border-border text-text-primary rounded-[8px] font-bold text-[13px] hover:bg-surface transition-colors"
          >
            Withdraw
          </button>
          <button 
            onClick={() => setIsDepositModalOpen(true)}
            className="flex-1 h-[40px] px-6 bg-accent text-accent-text rounded-[8px] font-bold text-[13px] flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            Deposit
          </button>
        </div>
        <ApproveCard />
        
        {/* Social Linking Card */}
        <SocialLinkingCard />
      </div>

      <AnimatePresence>
        {isHistorySheetOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60]"
              onClick={() => setIsHistorySheetOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 h-[85vh] bg-bg-center border-t border-border z-[70] rounded-t-[24px] flex flex-col"
            >
              <div className="p-6 flex flex-col h-full">
                <div className="w-12 h-1 bg-border rounded-full mx-auto mb-6 shrink-0" />
                <div className="mb-4 flex items-end justify-between shrink-0">
                  <div>
                    <h1 className="text-text-primary text-[22px] font-[800]">
                      History
                    </h1>
                    <p className="text-text-secondary text-[13px] mt-1">
                      {bets.filter(b => b.status === 'pending').length} Active bets · {transfers.length} Transfers
                    </p>
                  </div>
                  <button onClick={() => setIsHistorySheetOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border text-text-primary hover:bg-border transition-colors">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M1 1L13 13M1 13L13 1" />
                    </svg>
                  </button>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2 mb-4 shrink-0">
                  {([["all", "All"], ["bets", "Bets"], ["transfers", "Deposits & Withdrawals"]] as const).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setHistoryTab(key)}
                      className={`h-[30px] px-3 rounded-full text-[12px] font-bold transition-colors ${
                        historyTab === key
                          ? "bg-text-primary text-bg-center"
                          : "bg-surface border border-border text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col flex-1 overflow-y-auto pb-8">
                  {(() => {
                    const filtered = historyItems.filter((it: any) =>
                      historyTab === "all" ? true :
                      historyTab === "bets" ? (it.kind === "bet_sent" || it.kind === "bet_received") :
                      (it.kind === "deposit" || it.kind === "withdrawal")
                    );
                    if (filtered.length === 0) {
                      return (
                        <div className="py-8 text-center text-text-muted text-[13px]">
                          Nothing here yet.
                        </div>
                      );
                    }
                    return filtered.map((item: any) => {
                      const isTransfer = item.kind === "deposit" || item.kind === "withdrawal";
                      const isRecipientBet = item.kind === "bet_received";
                      // Icon + label + amount styling per type
                      const meta = isTransfer
                        ? item.kind === "deposit"
                          ? { label: "Deposit", sub: `From ${item.counterparty?.slice(0, 6)}…${item.counterparty?.slice(-4)}`, amount: `+${item.amount.toFixed(2)}`, green: true }
                          : { label: "Withdrawal", sub: `To ${item.counterparty?.slice(0, 6)}…${item.counterparty?.slice(-4)}`, amount: `−${item.amount.toFixed(2)}`, green: false }
                        : { label: item.condition_str || "Conditional bet", sub: `${isRecipientBet ? "Received" : "Sent"} · ${item.platform || "webapp"}`, amount: `${item.amount} `, green: isRecipientBet };
                      const when = item._ts ? new Date(item._ts).toLocaleDateString() : "";
                      return (
                        <div key={item.id} className="min-h-[68px] shrink-0 flex items-center justify-between border-t border-divider py-3 gap-3">
                          {/* type icon */}
                          <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center ${isTransfer ? (item.kind === "deposit" ? "bg-success/15 text-success" : "bg-bg-edge text-text-secondary") : "bg-surface border border-border text-text-secondary"}`}>
                            {isTransfer ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={item.kind === "deposit" ? "" : "rotate-180"}>
                                <path d="M12 19V5M5 12l7-7 7 7" />
                              </svg>
                            ) : (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20"/></svg>
                            )}
                          </div>

                          <div className="flex flex-col flex-1 min-w-0 pr-2">
                            <span className="text-text-primary text-[14px] font-bold truncate">{meta.label}</span>
                            <span className="text-text-muted text-[12px] mt-0.5 truncate">{meta.sub}{when ? ` · ${when}` : ""}</span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`text-[13px] font-mono font-bold ${meta.green ? "text-success" : "text-text-primary"}`}>
                              {meta.amount}<span className="text-[11px] font-normal text-text-muted"> USDT</span>
                            </span>
                            {item.status === 'pending' && isRecipientBet ? (
                              <button
                                onClick={() => setSelectedClaimBet(item)}
                                className="h-[32px] px-[16px] bg-accent text-accent-text font-bold rounded-[6px] text-[13px] flex items-center justify-center hover:opacity-90 transition-opacity"
                              >
                                Claim
                              </button>
                            ) : (
                              <button
                                onClick={() => setSelectedReceipt(item)}
                                className="h-[32px] px-[16px] bg-surface border border-border text-text-primary font-bold rounded-[6px] text-[13px] flex items-center justify-center hover:bg-border transition-colors"
                              >
                                Receipt
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Start Tipping Section */}
      <div className="w-full mb-16 flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-6 border-t border-divider">
        <div className="flex flex-col text-left sm:max-w-[320px]">
          <h2 className="text-text-primary text-[16px] font-bold mb-2">Start Tipping</h2>

      <ClaimModal 
        isOpen={!!selectedClaimBet} 
        onClose={() => setSelectedClaimBet(null)} 
        bet={selectedClaimBet}
        onClaimed={() => {
          setSelectedClaimBet(null);
          fetchBets();
        }}
      />
      
      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        entry={selectedReceipt}
      />
          <p className="text-text-muted text-[13px] leading-relaxed">
            Ready to put your money where your mouth is? Tweet at @tether.arena, add the bot to your Discord server, or join the Telegram group.
          </p>
        </div>
        
        <div className="flex flex-col gap-3 w-full sm:w-auto">
          <Link href="https://x.com/intent/tweet?text=@tetherarena%20pay%20@user%2010%20USDT%20for%20winning%20the%20match" target="_blank" rel="noopener noreferrer" className="h-[46px] w-full sm:w-[240px] px-5 bg-surface border border-border text-text-primary rounded-[8px] font-bold text-[12px] flex items-center justify-between hover:bg-border transition-colors">
            Tweet at @tether.arena
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </Link>
          <Link href="https://discord.com/oauth2/authorize?client_id=1523511863298621531" target="_blank" rel="noopener noreferrer" className="h-[46px] w-full sm:w-[240px] px-5 bg-surface border border-border text-text-primary rounded-[8px] font-bold text-[12px] flex items-center justify-between hover:bg-border transition-colors">
            Add to a discord server
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
          </Link>
          <Link href="https://t.me/TarenaAi_bot?startgroup=new" target="_blank" rel="noopener noreferrer" className="h-[46px] w-full sm:w-[240px] px-5 bg-surface border border-border text-text-primary rounded-[8px] font-bold text-[12px] flex items-center justify-between hover:bg-border transition-colors">
            Add to Telegram group
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.888-.662 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
          </Link>
        </div>
      </div>

      {/* Accordions */}
      <div className="w-full flex flex-col mb-10">
        <Accordion title="Active conditions (Tournaments)">
          <div className="flex flex-col gap-3 text-[13px] text-text-muted">
            <p><strong>FIFA World Cup 2026 Qualifiers:</strong> Available for all match outcomes.</p>
            <p><strong>UEFA Champions League:</strong> Available for knockout stages.</p>
            <p><strong>Premier League:</strong> Supported every weekend.</p>
          </div>
        </Accordion>

        <Accordion title="Command examples">
          <div className="flex flex-col gap-4 text-[12px] text-text-muted font-mono">
            <div className="bg-surface p-4 rounded-[6px] border border-border">
              @tether.arena send 15 USDT to @jade if Nigeria beats Brazil
            </div>
            <div className="bg-surface p-4 rounded-[6px] border border-border">
              /bet send 20 USDT to @sam if Morocco draws France
            </div>
            <div className="bg-surface p-4 rounded-[6px] border border-border">
              if brazil loses to nigeria, @sam gets 30 USDT
            </div>
          </div>
        </Accordion>
      </div>

      <WithdrawModal 
        isOpen={isWithdrawModalOpen} 
        onClose={() => setIsWithdrawModalOpen(false)} 
      />
      <DepositModal 
        isOpen={isDepositModalOpen} 
        onClose={() => setIsDepositModalOpen(false)} 
      />
    </div>
  );
}
