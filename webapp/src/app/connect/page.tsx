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
        <Link href="/link-socials" className="w-full h-[72px] bg-surface border border-border hover:border-border-emphasis transition-colors rounded-[10px] px-5 flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.914 7.64303L20.89 3.01803L15.352 6.13603L12 4.10303L8.648 6.13603L3.111 3.01803L2.086 7.64303L5.342 12.387L2 17.585L3.626 21.603L8.85 19.467L12 21.056L15.15 19.467L20.374 21.603L22 17.585L18.658 12.387L21.914 7.64303Z" stroke="#F2F1EF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-text-primary text-[16px] font-bold">MetaMask or browser wallet</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-text-secondary group-hover:text-text-primary transition-colors">
            <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>

        <Link href="/link-socials" className="w-full h-[72px] bg-surface border border-border hover:border-border-emphasis transition-colors rounded-[10px] px-5 flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.68652 10.7417C8.72652 6.94073 15.2745 6.94073 19.3145 10.7417C19.5535 10.9667 19.5665 11.3417 19.3415 11.5817L17.7025 13.3117C17.5835 13.4367 17.4125 13.5017 17.2385 13.4867C17.0635 13.4717 16.9055 13.3817 16.8095 13.2387C14.0765 9.17673 8.16052 9.42173 5.75352 13.6877C5.66652 13.8407 5.51252 13.9357 5.33752 13.9517C5.16352 13.9677 4.99252 13.9017 4.87352 13.7767L3.21852 12.0297C2.99152 11.7907 3.00152 11.4137 3.24252 11.1867C3.69352 10.7607 4.17952 10.3737 4.68652 10.7417Z" stroke="#F2F1EF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="7" cy="18" r="2" fill="#F2F1EF"/>
                <circle cx="17" cy="18" r="2" fill="#F2F1EF"/>
              </svg>
            </div>
            <span className="text-text-primary text-[16px] font-bold">WalletConnect</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-text-secondary group-hover:text-text-primary transition-colors">
            <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>

        <Link href="/link-socials" className="w-full h-[72px] bg-surface border border-border-emphasis hover:bg-[#151515] transition-colors rounded-[10px] px-5 flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-border-emphasis flex items-center justify-center">
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
        href="/link-socials"
        className="w-full h-[52px] bg-accent text-accent-text font-bold rounded-[10px] flex items-center justify-center hover:opacity-90 transition-opacity"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
          <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.78 15.69 17.57V20.34H19.26C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="currentColor"/>
          <path d="M12 23C14.97 23 17.46 22.02 19.26 20.34L15.69 17.57C14.71 18.23 13.47 18.63 12 18.63C9.16 18.63 6.75 16.71 5.88 14.15H2.21V17C4.01 20.59 7.7 23 12 23Z" fill="currentColor"/>
          <path d="M5.88 14.15C5.66 13.49 5.54 12.76 5.54 12C5.54 11.24 5.66 10.51 5.88 9.85V7H2.21C1.47 8.48 1.05 10.18 1.05 12C1.05 13.82 1.47 15.52 2.21 17L5.88 14.15Z" fill="currentColor"/>
          <path d="M12 5.38C13.62 5.38 15.06 5.93 16.2 7.02L19.34 3.88C17.45 2.12 14.97 1 12 1C7.7 1 4.01 3.41 2.21 7L5.88 9.85C6.75 7.29 9.16 5.38 12 5.38Z" fill="currentColor"/>
        </svg>
        Continue with Google
      </Link>
    </div>
  );
}
