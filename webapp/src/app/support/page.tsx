import Link from "next/link";

export default function Support() {
  return (
    <div className="w-full max-w-[800px] flex flex-col pt-8 pb-24 px-4 mx-auto">
      <div className="mt-4 sm:mt-12 bg-surface border border-border rounded-[16px] p-5 sm:p-8 md:p-12 prose prose-invert max-w-none">
        <h1 className="text-text-primary text-[28px] font-[800] mb-8">Support</h1>

        <section className="mb-8">
          <p className="text-text-muted text-[14px] leading-relaxed mb-4">
            tether.arena is a decentralized protocol interface. Because we do not have custody of your funds, our ability to assist with lost assets, blocked transactions, or smart contract interactions is inherently limited.
          </p>
        </section>

        {/* Direct support — Telegram */}
        <a
          href="https://t.me/bossop1"
          target="_blank"
          rel="noopener noreferrer"
          className="group no-underline flex items-center gap-4 bg-bg-center border border-border rounded-[12px] p-5 mb-8 hover:border-border-emphasis transition-colors"
        >
          <div className="w-12 h-12 rounded-[10px] shrink-0 flex items-center justify-center bg-[#229ED9]/15">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21.94 4.63 18.9 19.03c-.23 1.01-.83 1.26-1.68.78l-4.64-3.42-2.24 2.15c-.25.25-.46.46-.94.46l.33-4.73 8.62-7.79c.38-.33-.08-.52-.58-.19L6.44 13.2 1.86 11.77c-1-.31-1.02-1 .21-1.48l17.9-6.9c.83-.31 1.56.19 1.29 1.24Z" fill="#229ED9"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-text-primary text-[15px] font-bold m-0">Chat with us on Telegram</p>
            <p className="text-text-muted text-[13px] m-0 mt-0.5">Message @bossop1 directly for help</p>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-text-muted group-hover:text-text-primary transition-colors" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>

        <section className="mb-8">
          <h2 className="text-text-primary text-[18px] font-bold mb-4">Community Channels</h2>
          <p className="text-text-muted text-[14px] leading-relaxed mb-4">
            For general questions, troubleshooting, and protocol updates, please engage with the community:
          </p>
          <ul className="text-text-muted text-[14px] list-disc pl-5 mb-4 flex flex-col gap-2">
            <li><strong>X (Twitter):</strong> <a href="https://x.com/tether_arena" target="_blank" rel="noopener noreferrer" className="text-text-primary hover:underline">@tether_arena</a></li>
            <li><strong>Discord:</strong> Join the official server for developer support and bug reporting.</li>
            <li><strong>Telegram:</strong> Engage with other users and moderators in the public group.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-text-primary text-[18px] font-bold mb-4">Technical Issues & Bug Bounties</h2>
          <p className="text-text-muted text-[14px] leading-relaxed mb-4">
            If you encounter a UI glitch, bridging failure, or oracle desync, please report it via our GitHub repository issues page. Critical smart contract vulnerabilities are eligible for bug bounties.
          </p>
          <p className="text-text-muted text-[14px] leading-relaxed font-bold text-[#D53131]">
            NOTE: Site administrators and moderators will NEVER ask for your private keys, seed phrases, or Google account credentials.
          </p>
        </section>

        <div className="mt-12 pt-8 border-t border-divider flex justify-center">
          <Link href="/" className="h-[42px] px-6 bg-transparent border border-border text-text-primary rounded-[8px] font-bold text-[13px] hover:bg-surface transition-colors flex items-center justify-center">
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
