import Link from "next/link";

export default function Claim() {
  return (
    <div className="w-full flex justify-center pt-8">
      {/* Light Theme Card for Claiming */}
      <div className="w-full max-w-[420px] bg-[#F2F1EF] rounded-[16px] p-8 text-[#050505]">
        <div className="flex justify-center mb-10">
          <div className="flex items-baseline gap-0.5">
            <span className="font-[800] text-[#050505] text-[24px] tracking-tight">tether</span>
            <span className="font-[800] text-[#797977] text-[24px]">.</span>
            <span className="font-[400] text-[#050505] text-[24px] tracking-tight">arena</span>
          </div>
        </div>

        <div className="mb-6">
          <span className="text-[#797977] text-[11px] font-normal uppercase tracking-[0.1em]">
            CLAIM · STEP 1 OF 2
          </span>
          <h1 className="text-[#050505] text-[40px] font-[800] leading-none mt-2 mb-3 tracking-tight">
            You won.
          </h1>
          <p className="text-[#797977] text-[15px]">
            Argentina wins WC2026 final · 50 USDT
          </p>
        </div>

        <div className="flex flex-col gap-2 font-mono text-[14px] mb-6">
          <div className="flex justify-between">
            <span className="text-[#050505]">You receive:</span>
            <span className="text-[#050505]">50.00 USDT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#050505]">Fee:</span>
            <span className="text-[#050505]">0.30 USDT</span>
          </div>
          <div className="flex justify-between font-bold">
            <span className="text-[#050505]">Net:</span>
            <span className="text-[#050505]">49.70 USDT</span>
          </div>
        </div>

        <div className="w-full h-[1px] bg-[#D1D1D1] mb-6"></div>

        <div className="flex flex-col mb-6">
          <label className="text-[#797977] text-[13px] mb-2">Send to</label>
          <input
            type="text"
            placeholder="MagicPay link or wallet address"
            className="w-full h-[52px] bg-[#050505] border border-[#2A2A2A] rounded-[10px] px-4 text-[#F2F1EF] text-[15px] focus:outline-none focus:border-[#3A3A3A] transition-colors"
          />
        </div>

        <p className="text-[#797977] text-[14px] mb-4">
          Or claim directly to your connected wallet.
        </p>

        <div className="flex flex-col gap-3">
          <button className="w-full h-[52px] bg-[#D53131] text-[#000000] font-bold rounded-[10px] flex items-center justify-center hover:opacity-90 transition-opacity">
            Claim 49.70 USDT
          </button>
          
          <Link 
            href="/dashboard"
            className="w-full h-[52px] bg-transparent text-[#050505] border border-[#050505] font-bold rounded-[10px] flex items-center justify-center hover:bg-[#E2E1DF] transition-colors"
          >
            Request refund instead
          </Link>
        </div>
      </div>
    </div>
  );
}
