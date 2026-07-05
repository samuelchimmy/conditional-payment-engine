import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="w-full max-w-[640px] flex flex-col pt-8">
      {/* Top Address & Action Bar */}
      <div className="flex items-center justify-between mb-16">
        <div className="flex flex-col">
          <span className="text-text-secondary text-[11px] font-normal uppercase tracking-[0.1em]">
            DASHBOARD / MY BETS
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[13px] text-text-secondary">
            0x4f2a...9c3b
          </span>
          <Link href="/deposit" className="h-[32px] px-[18px] bg-transparent border border-border rounded-[6px] text-[13px] font-bold text-text-primary flex items-center justify-center hover:bg-surface transition-colors">
            Deposit
          </Link>
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

      <div className="flex justify-end mb-4">
        <Link href="/place" className="h-[52px] px-8 bg-accent text-accent-text font-bold rounded-[10px] text-[16px] flex items-center justify-center hover:opacity-90 transition-opacity">
          New Bet
        </Link>
      </div>

      <p className="text-text-muted text-[13px] text-center mb-10">
        Settled bets pay out within 2 minutes.
      </p>
    </div>
  );
}
