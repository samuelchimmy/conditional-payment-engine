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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.2 5.3l-2.4 1.7 1.3 4.2-1.9 1.4 1.1 5.4-4.8-1.5-2.5 3.5-2.5-3.5-4.8 1.5 1.1-5.4-1.9-1.4 1.3-4.2-2.4-1.7 3.3 4.8 2.3-3.6 3.6 3.4 3.6-3.4 2.3 3.6z"/>
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
              <svg width="20" height="20" viewBox="0 0 40 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.598 12.378C14.896 6.297 25.104 6.297 31.402 12.378l1.411 1.362c.414.4.414 1.05 0 1.45l-3.327 3.212c-.198.192-.521.192-.72 0l-1.468-1.418c-3.993-3.856-10.468-3.856-14.461 0l-1.341 1.295c-.21.203-.55.203-.76 0L7.41 15.191c-.413-.4-.413-1.049 0-1.45l1.188-1.147zm26.969 8.232l3.327 3.212c.414.4.414 1.05 0 1.45l-8.239 7.957c-.414.4-1.085.4-1.5 0l-8.777-8.476c-.21-.202-.55-.202-.76 0l-8.776 8.476c-.414.4-1.086.4-1.5 0l-8.24-7.957c-.413-.4-.413-1.05 0-1.45l3.328-3.212c.198-.192.521-.192.72 0l7.531 7.273c.198.192.521.192.72 0l8.776-8.476c.414-.4 1.086-.4 1.5 0l8.777 8.476c.198.192.521.192.72 0l7.532-7.273c.198-.192.521-.192.72 0z"/>
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
            <div className="w-8 h-8 rounded-full bg-border-emphasis flex items-center justify-center overflow-hidden">
              <img src="/wdk-logo.svg" alt="WDK" className="h-[14px] w-auto ml-1 grayscale opacity-90 brightness-0 dark:brightness-200 dark:invert-0" style={{ filter: "brightness(0) dark:brightness(200)" }} />
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
