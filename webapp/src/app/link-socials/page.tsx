import Link from "next/link";

export default function LinkSocials() {
  return (
    <div className="w-full max-w-[420px] flex flex-col pt-12">
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-text-primary text-[32px] font-[800]">
          Link social accounts
        </h1>
        <p className="text-text-muted text-[15px] mt-2">
          Connect your accounts to send and receive tips
        </p>
      </div>

      <div className="flex flex-col gap-4 mb-4">
        {/* Twitter/X Connect Row */}
        <button className="w-full h-[72px] bg-surface border border-border hover:border-border-emphasis transition-colors rounded-[10px] px-5 flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center">
              {/* X icon placeholder */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.244 2.25H21.552L14.325 10.51L22.827 21.75H16.17L10.956 14.933L4.99 21.75H1.68L9.41 12.915L1.254 2.25H8.08L12.793 8.481L18.244 2.25ZM17.083 19.77H18.916L7.084 4.126H5.117L17.083 19.77Z" fill="#F2F1EF"/>
              </svg>
            </div>
            <span className="text-text-primary text-[16px] font-bold">Connect X (Twitter)</span>
          </div>
          <span className="text-text-secondary text-[14px] group-hover:text-text-primary transition-colors">Link</span>
        </button>

        {/* Discord Connect Row */}
        <button className="w-full h-[72px] bg-surface border border-border hover:border-border-emphasis transition-colors rounded-[10px] px-5 flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center">
              {/* Discord icon placeholder */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4C14.82 4.33 14.61 4.78 14.46 5.14C12.89 4.91 11.34 4.91 9.8 5.14C9.64 4.78 9.43 4.33 9.25 4C7.75 4.26 6.31 4.71 4.98 5.33C2.31 9.35 1.58 13.27 1.95 17.15C3.73 18.47 5.46 19.26 7.14 19.78C7.55 19.22 7.92 18.63 8.24 18.01C7.63 17.78 7.05 17.5 6.5 17.16C6.65 17.05 6.79 16.93 6.93 16.81C10.23 18.35 13.8 18.35 17.07 16.81C17.21 16.93 17.36 17.05 17.5 17.16C16.95 17.5 16.37 17.78 15.76 18.01C16.08 18.63 16.45 19.22 16.86 19.78C18.54 19.26 20.27 18.47 22.05 17.15C22.48 12.67 21.37 8.84 19.27 5.33ZM8.56 14.28C7.57 14.28 6.76 13.38 6.76 12.28C6.76 11.18 7.55 10.28 8.56 10.28C9.57 10.28 10.38 11.18 10.36 12.28C10.36 13.38 9.57 14.28 8.56 14.28ZM15.68 14.28C14.69 14.28 13.88 13.38 13.88 12.28C13.88 11.18 14.67 10.28 15.68 10.28C16.69 10.28 17.5 11.18 17.48 12.28C17.48 13.38 16.69 14.28 15.68 14.28Z" fill="#F2F1EF"/>
              </svg>
            </div>
            <span className="text-text-primary text-[16px] font-bold">Connect Discord</span>
          </div>
          <span className="text-text-secondary text-[14px] group-hover:text-text-primary transition-colors">Link</span>
        </button>
      </div>

      <p className="text-text-muted text-[13px] text-center sm:text-left mb-10">
        Linking allows you to talk in plain language to place and claim bets directly from social platforms.
      </p>

      <Link 
        href="/dashboard"
        className="w-full h-[52px] bg-transparent border border-border text-text-primary font-bold rounded-[10px] flex items-center justify-center hover:bg-surface transition-colors"
      >
        Skip for now
      </Link>
    </div>
  );
}
