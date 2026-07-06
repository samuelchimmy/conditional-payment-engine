"use client";

import Link from "next/link";
import { useState } from "react";
import { Accordion } from "@/components/Accordion";
import { WithdrawModal } from "@/components/WithdrawModal";
import { DepositModal } from "@/components/DepositModal";
import { SettingsModal } from "@/components/SettingsModal";
import { useAccount, useReadContract } from "wagmi";
import { ERC20ABI, USDTAddressCelo } from "@/lib/contracts";
import { formatUnits } from "viem";

export default function Dashboard() {
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const { address, isConnected } = useAccount();

  const { data: balanceData } = useReadContract({
    address: USDTAddressCelo,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  const formattedBalance = balanceData 
    ? parseFloat(formatUnits(balanceData as bigint, 6)).toFixed(2) 
    : "0.00";

  return (
    <div className="w-full max-w-[640px] flex flex-col pt-8">
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
          <span className="font-mono text-[12px] text-text-primary bg-surface px-4 py-2 rounded-[8px] border border-border inline-flex items-center gap-2 cursor-pointer hover:border-border-emphasis transition-colors">
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
      <div className="flex flex-col items-start w-full mb-16">
        <div className="bg-surface border border-border rounded-[10px] px-6 py-4 flex flex-col mb-3 w-full">
          <span className="text-text-secondary text-[11px] uppercase tracking-wider mb-1">Balance</span>
          <span className="text-text-primary text-[20px] font-[800] tracking-tight">{formattedBalance} <span className="text-text-secondary text-[15px] font-normal">USDT</span></span>
        </div>
        <div className="flex items-center gap-3 w-full">
          <button 
            onClick={() => setIsWithdrawModalOpen(true)}
            className="flex-1 h-[42px] px-6 bg-transparent border border-border text-text-primary rounded-[8px] font-bold text-[13px] hover:bg-surface transition-colors"
          >
            Withdraw
          </button>
          <button 
            onClick={() => setIsDepositModalOpen(true)}
            className="flex-1 h-[42px] px-6 bg-accent text-accent-text rounded-[8px] font-bold text-[13px] flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            Deposit
          </button>
        </div>
      </div>

      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-text-primary text-[28px] font-[800]">
            My Bets
          </h1>
          <p className="text-text-secondary text-[14px] mt-1">
            3 Active · 1 Completed
          </p>
        </div>
        
        <Link href="/place" className="h-[42px] px-6 bg-accent text-accent-text font-bold rounded-[8px] text-[13px] flex items-center justify-center hover:opacity-90 transition-opacity">
          New Bet
        </Link>
      </div>

      <div className="flex flex-col mb-16">
        <div className="h-[72px] flex items-center justify-between border-t border-divider">
          <div className="flex flex-col">
            <span className="text-text-primary text-[14px] font-bold">Trandition as endrepo vs havatim...</span>
            <span className="text-text-muted text-[12px]">50 USDT · Locked 2 days ago</span>
          </div>
          <span className="text-text-muted text-[14px] font-medium">Pending</span>
        </div>

        <div className="h-[72px] flex items-center justify-between border-t border-divider">
          <div className="flex flex-col">
            <span className="text-text-primary text-[14px] font-bold">Trandition as endrepo vs havatim...</span>
            <span className="text-text-muted text-[12px]">50 USDT · Locked 2 days ago</span>
          </div>
          <span className="text-text-muted text-[14px] font-medium">Pending</span>
        </div>

        <div className="h-[72px] flex items-center justify-between border-t border-divider">
          <div className="flex flex-col">
            <span className="text-text-primary text-[14px] font-bold">Trandition as endrepo vs nagatim...</span>
            <span className="text-text-muted text-[12px]">50 USDT · Locked 2 days ago</span>
          </div>
          <span className="text-text-muted text-[14px] font-medium">Resolved</span>
        </div>

        <div className="h-[72px] flex items-center justify-between border-t border-divider">
          <div className="flex flex-col">
            <span className="text-text-primary text-[14px] font-bold">Trandition as endrepo vs nasatim...</span>
            <span className="text-text-muted text-[12px]">50 USDT · Locked 2 days ago</span>
          </div>
          <Link href="/claim" className="h-[32px] px-[18px] bg-accent text-accent-text font-bold rounded-[6px] text-[13px] flex items-center justify-center hover:opacity-90 transition-opacity">
            Claim
          </Link>
        </div>
      </div>

      {/* Start Tipping Section */}
      <div className="w-full mb-16 flex flex-col sm:flex-row sm:items-start justify-between gap-8 pt-6 border-t border-divider">
        <div className="flex flex-col text-left sm:max-w-[320px]">
          <h2 className="text-text-primary text-[18px] font-bold mb-2">Start Tipping</h2>
          <p className="text-text-muted text-[13px] leading-relaxed">
            Ready to put your money where your mouth is? Tweet at @tether.arena, add the bot to your Discord server, or join the Telegram group.
          </p>
        </div>
        
        <div className="flex flex-col gap-3 w-full sm:w-auto">
          <Link href="https://x.com/intent/tweet?text=@tetherarena%20pay%20@user%2010%20USDT%20for%20winning%20the%20match" target="_blank" rel="noopener noreferrer" className="h-[46px] w-full sm:w-[240px] px-5 bg-surface border border-border text-text-primary rounded-[8px] font-bold text-[12px] flex items-center justify-between hover:bg-border transition-colors">
            Tweet at @tether.arena
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </Link>
          <Link href="https://discord.com/oauth2/authorize?client_id=1523511863298621531&permissions=8&response_type=code&redirect_uri=https%3A%2F%2Ftarena.xyz%2Fdashboard&integration_type=0&scope=identify+bot+guilds.members.read+activities.write+relationships.write+role_connections.write+openid+gateway.connect+identify.premium+guilds+guilds.channels.read+rpc+activities.invites.write" target="_blank" rel="noopener noreferrer" className="h-[46px] w-full sm:w-[240px] px-5 bg-surface border border-border text-text-primary rounded-[8px] font-bold text-[12px] flex items-center justify-between hover:bg-border transition-colors">
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
