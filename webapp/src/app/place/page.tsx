import Link from "next/link";

export default function PlaceBet() {
  return (
    <div className="w-full max-w-[480px] flex flex-col pt-12">
      <div className="mb-8">
        <span className="text-text-secondary text-[10px] font-normal uppercase tracking-[0.1em]">
          PLACE BET · 1 OF 3
        </span>
        <h1 className="text-text-primary text-[28px] font-[800] mt-2">
          What's the bet?
        </h1>
      </div>

      <div className="flex flex-col gap-6">
        <textarea
          className="w-full h-[140px] bg-surface border border-border rounded-[10px] p-5 text-text-primary text-[14px] resize-none focus:outline-none focus:border-border-emphasis transition-colors"
          placeholder="e.g. Argentina wins the 2026 World Cup final"
        />

        <div className="flex gap-4">
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-text-secondary text-[11px]">Amount (USDT)</label>
            <input
              type="text"
              className="w-full h-[52px] bg-surface border border-border rounded-[10px] px-4 text-text-primary text-[14px] focus:outline-none focus:border-border-emphasis transition-colors"
            />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-text-secondary text-[11px]">Their wallet address</label>
            <input
              type="text"
              className="w-full h-[52px] bg-surface border border-border rounded-[10px] px-4 text-text-primary text-[14px] focus:outline-none focus:border-border-emphasis transition-colors"
            />
          </div>
        </div>

        <div className="w-full h-[1px] bg-divider my-2"></div>

        <div className="flex flex-col gap-2 font-mono text-[13px] mb-4">
          <div className="flex justify-between">
            <span className="text-text-secondary">Lock:</span>
            <span className="text-text-primary">50 USDT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Condition:</span>
            <span className="text-text-primary">Argentina wins WC2026</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Recipient:</span>
            <span className="text-text-primary">0x4f2a...9c3b</span>
          </div>
        </div>

        <Link 
          href="/connect"
          className="w-full h-[52px] bg-accent text-accent-text font-bold rounded-[10px] flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          Review and Lock Funds
        </Link>
      </div>
    </div>
  );
}
