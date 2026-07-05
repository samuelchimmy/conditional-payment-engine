import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="w-full max-w-[640px] flex flex-col pt-12 pb-24">
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-text-primary text-[32px] font-[800]">
            My Bets
          </h1>
          <p className="text-text-muted text-[15px] mt-2">
            Manage your conditional payments
          </p>
        </div>
        
        {/* Balance Card Section */}
        <div className="flex flex-col items-end">
          <div className="bg-surface border border-border rounded-[10px] px-6 py-4 min-w-[200px] flex flex-col mb-3">
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

      <div className="flex flex-col w-full">
        <div className="h-[72px] flex items-center justify-between border-t border-divider">
          <div className="flex flex-col">
            <span className="text-text-primary text-[15px] font-semibold">Nigeria vs Brazil</span>
            <span className="text-text-secondary text-[13px] mt-0.5">Nigeria to win</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-text-primary font-mono text-[14px]">15.00</span>
            <span className="text-text-muted text-[14px] font-medium min-w-[60px] text-right">Pending</span>
          </div>
        </div>

        <div className="h-[72px] flex items-center justify-between border-t border-divider">
          <div className="flex flex-col">
            <span className="text-text-primary text-[15px] font-semibold">France vs Morocco</span>
            <span className="text-text-secondary text-[13px] mt-0.5">Draw</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-text-primary font-mono text-[14px]">20.00</span>
            <button className="h-[32px] px-[18px] bg-accent text-accent-text rounded-[6px] font-bold text-[13px] hover:opacity-90 transition-opacity">
              Claim
            </button>
          </div>
        </div>

        <div className="h-[72px] flex items-center justify-between border-t border-divider">
          <div className="flex flex-col">
            <span className="text-text-primary text-[15px] font-semibold">Spain vs Argentina</span>
            <span className="text-text-secondary text-[13px] mt-0.5">Argentina to win</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-text-primary font-mono text-[14px]">10.00</span>
            <button className="h-[32px] px-[18px] bg-transparent border border-border text-text-primary rounded-[6px] font-bold text-[13px] hover:bg-surface transition-colors">
              Refund
            </button>
          </div>
        </div>
        
        <div className="border-t border-divider w-full"></div>
      </div>
    </div>
  );
}
