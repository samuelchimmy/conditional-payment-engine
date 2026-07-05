import Link from "next/link";

export default function ApproveAllowance() {
  return (
    <div className="w-full max-w-[440px] flex flex-col pt-8">
      <div className="mb-6 text-center sm:text-left">
        <h1 className="text-text-primary text-[32px] font-[800]">
          Approve allowance
        </h1>
        <p className="text-text-muted text-[15px] mt-2">
          Grant the engine permission to move your USDT only when your bet conditions are met.
        </p>
      </div>

      <div className="w-full flex flex-col gap-6 mb-8">
        <div className="flex flex-col gap-2">
          <label className="text-text-secondary text-[13px]">Amount to approve (USDT)</label>
          <div className="relative">
            <input 
              type="number" 
              placeholder="Unlimited" 
              className="w-full bg-surface border border-border rounded-[10px] h-[52px] pl-4 pr-24 text-text-primary text-[15px] focus:outline-none focus:border-border-emphasis transition-colors"
            />
            <div className="absolute right-2 top-0 bottom-0 flex items-center">
              <button className="h-[36px] px-3 bg-transparent text-text-primary font-bold text-[13px] rounded-[6px] hover:bg-border transition-colors">
                Unlimited
              </button>
            </div>
          </div>
          <p className="text-text-muted text-[12px] mt-1">
            Approving unlimited saves you from having to pay network fees for future bets.
          </p>
        </div>
      </div>

      <Link 
        href="/dashboard"
        className="w-full h-[52px] bg-accent text-accent-text font-bold rounded-[10px] flex items-center justify-center hover:opacity-90 transition-opacity"
      >
        Approve
      </Link>
      
      <Link 
        href="/dashboard"
        className="w-full h-[52px] bg-transparent text-text-primary border border-border font-bold rounded-[10px] flex items-center justify-center hover:bg-surface transition-colors mt-4"
      >
        Skip for now
      </Link>
    </div>
  );
}
