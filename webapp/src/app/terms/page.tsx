import { GlobalHeader } from "@/components/GlobalHeader";
import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="w-full max-w-[640px] flex flex-col pt-8 pb-24 px-4 mx-auto">
      <GlobalHeader />
      
      <div className="mt-12 bg-surface border border-border rounded-[16px] p-8 md:p-12 prose prose-invert max-w-none">
        <h1 className="text-text-primary text-[32px] font-[800] mb-8">Terms of Service</h1>
        <p className="text-text-secondary text-[14px] mb-8">Last Updated: July 5, 2026</p>

        <section className="mb-8">
          <h2 className="text-text-primary text-[20px] font-bold mb-4">1. Acceptance of Terms</h2>
          <p className="text-text-muted text-[15px] leading-relaxed mb-4">
            By accessing or using tether.arena (the "Platform", "Engine", "we", "us", or "our"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you must not use the Platform.
          </p>
          <p className="text-text-muted text-[15px] leading-relaxed">
            The Platform is a non-custodial, decentralized escrow protocol interface operating on blockchain networks. We provide a UI (User Interface) to interact with smart contracts.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-text-primary text-[20px] font-bold mb-4">2. Non-Custodial Nature & Assumption of Risk</h2>
          <p className="text-text-muted text-[15px] leading-relaxed mb-4">
            tether.arena operates entirely as a non-custodial engine. We do not have custody, control, or possession of your digital assets (e.g., USDT) at any time. All transactions, escrows, and payouts are executed deterministically by autonomous smart contracts running on the respective blockchain.
          </p>
          <p className="text-text-muted text-[15px] leading-relaxed mb-4">
            By using the Platform, you acknowledge that interacting with cryptographic and blockchain-based systems carries inherent, severe risks. You assume all liability for loss of funds resulting from smart contract vulnerabilities, oracle failures, network congestion, loss of private keys or Google Backup access, or regulatory actions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-text-primary text-[20px] font-bold mb-4">3. Oracle and Settlement Limitations</h2>
          <p className="text-text-muted text-[15px] leading-relaxed mb-4">
            Conditional tips (bets) are settled based on data provided by third-party APIs and decentralized oracles. The Platform and its developers are not responsible for the accuracy, timeliness, or validity of the data reported by these oracles. In the event of a disputed or misreported outcome, the smart contract's execution is final and irreversible.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-text-primary text-[20px] font-bold mb-4">4. Compliance with Local Laws</h2>
          <p className="text-text-muted text-[15px] leading-relaxed mb-4">
            You are solely responsible for determining whether your use of tether.arena is legal in your jurisdiction. The Platform does not facilitate traditional gambling; however, local laws regarding conditional escrow, tipping, and digital assets vary significantly. We actively block IP addresses from restricted jurisdictions and make no warranties regarding regulatory compliance in your locale.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-text-primary text-[20px] font-bold mb-4">5. Disclaimer of Warranties & Limitation of Liability</h2>
          <p className="text-text-muted text-[15px] leading-relaxed mb-4 uppercase tracking-[0.05em] font-bold text-[#D53131]">
            THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND.
          </p>
          <p className="text-text-muted text-[15px] leading-relaxed mb-4">
            To the maximum extent permitted by law, the developers, founders, contributors, and affiliates of tether.arena shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of, or inability to access or use, the Platform.
          </p>
          <p className="text-text-muted text-[15px] leading-relaxed">
            The developers maintain the software strictly as an open protocol and bear no fiduciary duty to any user.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-text-primary text-[20px] font-bold mb-4">6. Indemnification</h2>
          <p className="text-text-muted text-[15px] leading-relaxed mb-4">
            You agree to defend, indemnify, and hold harmless the developers of tether.arena from any claims, damages, obligations, losses, liabilities, costs, or debt arising from: (a) your use of and access to the Platform; (b) your violation of any term of these Terms of Service; (c) your violation of any third-party right, including without limitation any privacy or intellectual property right; or (d) your violation of any applicable law, rule, or regulation.
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
