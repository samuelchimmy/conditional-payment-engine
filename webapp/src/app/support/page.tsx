import { GlobalHeader } from "@/components/GlobalHeader";
import Link from "next/link";

export default function Support() {
  return (
    <div className="w-full max-w-[640px] flex flex-col pt-8 pb-24 px-4 mx-auto">
      <GlobalHeader />
      
      <div className="mt-12 bg-surface border border-border rounded-[16px] p-8 md:p-12 prose prose-invert max-w-none">
        <h1 className="text-text-primary text-[32px] font-[800] mb-8">Support</h1>

        <section className="mb-8">
          <p className="text-text-muted text-[15px] leading-relaxed mb-4">
            tether.arena is a decentralized protocol interface. Because we do not have custody of your funds, our ability to assist with lost assets, blocked transactions, or smart contract interactions is inherently limited.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-text-primary text-[20px] font-bold mb-4">Community Channels</h2>
          <p className="text-text-muted text-[15px] leading-relaxed mb-4">
            For general questions, troubleshooting, and protocol updates, please engage with the community:
          </p>
          <ul className="text-text-muted text-[15px] list-disc pl-5 mb-4 flex flex-col gap-2">
            <li><strong>X (Twitter):</strong> <a href="https://twitter.com/tether_arena" target="_blank" rel="noopener noreferrer" className="text-text-primary hover:underline">@tether_arena</a></li>
            <li><strong>Discord:</strong> Join the official server for developer support and bug reporting.</li>
            <li><strong>Telegram:</strong> Engage with other users and moderators in the public group.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-text-primary text-[20px] font-bold mb-4">Technical Issues & Bug Bounties</h2>
          <p className="text-text-muted text-[15px] leading-relaxed mb-4">
            If you encounter a UI glitch, bridging failure, or oracle desync, please report it via our GitHub repository issues page. Critical smart contract vulnerabilities are eligible for bug bounties.
          </p>
          <p className="text-text-muted text-[15px] leading-relaxed font-bold text-[#D53131]">
            NOTE: Site administrators and moderators will NEVER ask for your private keys, seed phrases, or Google account credentials.
          </p>
        </section>

        <div className="mt-12 pt-8 border-t border-divider flex justify-center">
          <Link href="/" className="h-[42px] px-6 bg-transparent border border-border text-text-primary rounded-[8px] font-bold text-[14px] hover:bg-surface transition-colors flex items-center justify-center">
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
