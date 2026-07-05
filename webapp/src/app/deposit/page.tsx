import Link from "next/link";

export default function Deposit() {
  return (
    <div className="w-full max-w-[440px] flex flex-col pt-8">
      <div className="mb-6 text-center sm:text-left">
        <h1 className="text-text-primary text-[32px] font-[800]">
          Add funds
        </h1>
        <p className="text-text-muted text-[15px] mt-2">
          USDT on Celo
        </p>
      </div>

      <div className="flex flex-col mb-4">
        {/* Direct Deposit Row - active state styling (mocking the expanded state) */}
        <div className="w-full bg-surface border border-border-emphasis rounded-t-[10px] px-5 py-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-text-primary text-[16px] font-bold">Direct deposit</span>
            <span className="text-text-muted text-[13px]">Send to your Celo address</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-text-primary transform rotate-90 transition-transform">
            <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* QR Code Expansion Panel */}
        <div className="w-full bg-surface border-x border-b border-border-emphasis p-6 flex flex-col items-center">
          <div className="w-[140px] h-[140px] bg-white p-2 rounded-[10px] mb-4 flex items-center justify-center">
            {/* Placeholder QR Code image. Typically you'd use a real library or image here */}
            <div className="w-full h-full border-4 border-black border-dashed flex items-center justify-center text-black font-bold text-[12px]">QR CODE</div>
          </div>
          
          <span className="font-mono text-text-primary text-[16px] tracking-wide mb-2">0x4f2a...8c3b</span>
          
          <button className="text-text-secondary text-[13px] underline underline-offset-4 hover:text-text-primary transition-colors mb-4">
            Copy address
          </button>
          
          <span className="text-text-muted text-[12px]">Min 1 USDT · Celo network</span>
        </div>

        {/* Bridge Row */}
        <button className="w-full bg-surface border border-border rounded-b-[10px] px-5 py-4 flex items-center justify-between hover:border-border-emphasis mt-2 transition-colors">
          <div className="flex flex-col items-start text-left">
            <span className="text-text-primary text-[16px] font-bold">Bridge from another chain</span>
            <span className="text-text-muted text-[13px]">Ethereum, Base, Arbitrum, Polygon, Optimism</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-text-secondary">
            <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <Link 
        href="/dashboard"
        className="w-full h-[52px] bg-accent text-accent-text font-bold rounded-[10px] flex items-center justify-center hover:opacity-90 transition-opacity mt-2"
      >
        I have sent funds
      </Link>
    </div>
  );
}
