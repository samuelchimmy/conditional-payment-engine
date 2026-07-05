import Link from "next/link";
import { Accordion } from "@/components/Accordion";

export default function Dashboard() {
  return (
    <div className="w-full max-w-[640px] flex flex-col pt-8">
      {/* Top Address & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-16 gap-6">
        <div className="flex flex-col">
          <span className="text-text-secondary text-[11px] font-normal uppercase tracking-[0.1em]">
            DASHBOARD / MY BETS
          </span>
          <div className="mt-4">
            <span className="font-mono text-[13px] text-text-secondary bg-surface px-3 py-1.5 rounded-full border border-border">
              0x4f2a...9c3b
            </span>
          </div>
        </div>
        
        {/* Re-injected Balance Card & Buttons */}
        <div className="flex flex-col items-start sm:items-end">
          <div className="bg-surface border border-border rounded-[10px] px-6 py-4 min-w-[200px] flex flex-col mb-3 w-full sm:w-auto">
            <span className="text-text-secondary text-[12px] uppercase tracking-wider mb-1">Balance</span>
            <span className="text-text-primary text-[24px] font-[800] tracking-tight">0.00 <span className="text-text-secondary text-[16px] font-normal">USDT</span></span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none h-[42px] px-6 bg-transparent border border-border text-text-primary rounded-[8px] font-bold text-[14px] hover:bg-surface transition-colors">
              Withdraw
            </button>
            <Link href="/deposit" className="flex-1 sm:flex-none h-[42px] px-6 bg-accent text-accent-text rounded-[8px] font-bold text-[14px] flex items-center justify-center hover:opacity-90 transition-opacity">
              Deposit
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-text-primary text-[32px] font-[800]">
          My Bets
        </h1>
        <p className="text-text-secondary text-[15px] mt-1">
          3 Active · 1 Completed
        </p>
      </div>

      {/* Restored exact previous rows format */}
      <div className="flex flex-col mb-16">
        {/* Row 1: Pending */}
        <div className="h-[72px] flex items-center justify-between border-t border-divider">
          <div className="flex flex-col">
            <span className="text-text-primary text-[15px] font-bold">Trandition as endrepo vs havatim...</span>
            <span className="text-text-muted text-[13px]">50 USDT · Locked 2 days ago</span>
          </div>
          <span className="text-text-muted text-[15px] font-medium">Pending</span>
        </div>

        {/* Row 2: Pending */}
        <div className="h-[72px] flex items-center justify-between border-t border-divider">
          <div className="flex flex-col">
            <span className="text-text-primary text-[15px] font-bold">Trandition as endrepo vs havatim...</span>
            <span className="text-text-muted text-[13px]">50 USDT · Locked 2 days ago</span>
          </div>
          <span className="text-text-muted text-[15px] font-medium">Pending</span>
        </div>

        {/* Row 3: Resolved */}
        <div className="h-[72px] flex items-center justify-between border-t border-divider">
          <div className="flex flex-col">
            <span className="text-text-primary text-[15px] font-bold">Trandition as endrepo vs nagatim...</span>
            <span className="text-text-muted text-[13px]">50 USDT · Locked 2 days ago</span>
          </div>
          <span className="text-text-muted text-[15px] font-medium">Resolved</span>
        </div>

        {/* Row 4: Claim */}
        <div className="h-[72px] flex items-center justify-between border-t border-divider">
          <div className="flex flex-col">
            <span className="text-text-primary text-[15px] font-bold">Trandition as endrepo vs nasatim...</span>
            <span className="text-text-muted text-[13px]">50 USDT · Locked 2 days ago</span>
          </div>
          <Link href="/claim" className="h-[32px] px-[18px] bg-accent text-accent-text font-bold rounded-[6px] text-[14px] flex items-center justify-center hover:opacity-90 transition-opacity">
            Claim
          </Link>
        </div>
      </div>

      <div className="flex justify-end mb-16">
        <Link href="/place" className="h-[52px] px-8 bg-accent text-accent-text font-bold rounded-[10px] text-[16px] flex items-center justify-center hover:opacity-90 transition-opacity">
          New Bet
        </Link>
      </div>

      {/* Start Tipping Section */}
      <div className="w-full bg-surface border border-border rounded-[10px] p-8 mb-16 flex flex-col items-center text-center">
        <h2 className="text-text-primary text-[20px] font-bold mb-3">Start Tipping</h2>
        <p className="text-text-muted text-[14px] max-w-[400px] mb-6 leading-relaxed">
          Ready to put your money where your mouth is? Tweet at <span className="text-text-primary">@tether.arena</span>, add the bot to your Discord server, or join the Telegram group.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="#" className="h-[42px] px-5 bg-transparent border border-border text-text-primary rounded-[8px] font-bold text-[13px] flex items-center hover:bg-border transition-colors">
            Tweet @tether.arena
          </Link>
          <Link href="#" className="h-[42px] px-5 bg-transparent border border-border text-text-primary rounded-[8px] font-bold text-[13px] flex items-center hover:bg-border transition-colors">
            Add to Discord
          </Link>
          <Link href="#" className="h-[42px] px-5 bg-transparent border border-border text-text-primary rounded-[8px] font-bold text-[13px] flex items-center hover:bg-border transition-colors">
            Join Telegram
          </Link>
        </div>
      </div>

      {/* Accordions */}
      <div className="w-full flex flex-col mb-10">
        <Accordion title="Active conditions (Tournaments)">
          <div className="flex flex-col gap-3 text-[14px] text-text-muted">
            <p><strong>FIFA World Cup 2026 Qualifiers:</strong> Available for all match outcomes.</p>
            <p><strong>UEFA Champions League:</strong> Available for knockout stages.</p>
            <p><strong>Premier League:</strong> Supported every weekend.</p>
          </div>
        </Accordion>

        <Accordion title="Command examples">
          <div className="flex flex-col gap-4 text-[13px] text-text-muted font-mono">
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

    </div>
  );
}
