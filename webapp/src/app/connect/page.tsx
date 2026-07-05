import Link from "next/link";

export default function ConnectWallet() {
  return (
    <div className="w-full max-w-[420px] flex flex-col pt-12">
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-text-primary text-[32px] font-[800]">
          Connect your wallet
        </h1>
        <p className="text-text-muted text-[15px] mt-2">
          Choose how to continue
        </p>
      </div>

      <div className="flex flex-col gap-4 mb-4">
        <button className="w-full h-[72px] bg-surface border border-border hover:border-border-emphasis transition-colors rounded-[10px] px-5 flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center">
              {/* Fox placeholder icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#F2F1EF" strokeWidth="2"/>
              </svg>
            </div>
            <span className="text-text-primary text-[16px] font-bold">MetaMask or browser wallet</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-text-secondary group-hover:text-text-primary transition-colors">
            <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <button className="w-full h-[72px] bg-surface border border-border hover:border-border-emphasis transition-colors rounded-[10px] px-5 flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center">
              {/* QR placeholder icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3H10V10H3V3Z" stroke="#F2F1EF" strokeWidth="2"/>
                <path d="M14 3H21V10H14V3Z" stroke="#F2F1EF" strokeWidth="2"/>
                <path d="M3 14H10V21H3V14Z" stroke="#F2F1EF" strokeWidth="2"/>
                <path d="M14 14H21V21H14V14Z" stroke="#F2F1EF" strokeWidth="2"/>
              </svg>
            </div>
            <span className="text-text-primary text-[16px] font-bold">WalletConnect</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-text-secondary group-hover:text-text-primary transition-colors">
            <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <Link href="/link-socials" className="w-full h-[72px] bg-surface border border-border-emphasis hover:bg-[#151515] transition-colors rounded-[10px] px-5 flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-border-emphasis flex items-center justify-center">
              {/* Stars placeholder icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#F2F1EF" strokeWidth="2" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-text-primary text-[16px] font-bold">Create new wallet</span>
              <span className="text-text-muted text-[13px] font-normal">(~30 sec)</span>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-text-secondary group-hover:text-text-primary transition-colors">
            <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>

      <p className="text-text-muted text-[13px] text-center sm:text-left mb-10">
        New wallets include a 12-word phrase and Google Drive backup.
      </p>

      <Link 
        href="/dashboard"
        className="w-full h-[52px] bg-accent text-accent-text font-bold rounded-[10px] flex items-center justify-center hover:opacity-90 transition-opacity"
      >
        Continue with Google
      </Link>
    </div>
  );
}
