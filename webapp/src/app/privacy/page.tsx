import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="w-full max-w-[800px] flex flex-col pt-8 pb-24 px-4 mx-auto">
      <div className="mt-4 sm:mt-12 bg-surface border border-border rounded-[16px] p-5 sm:p-8 md:p-12 prose prose-invert max-w-none">
        <h1 className="text-text-primary text-[32px] font-[800] mb-8">Privacy Policy</h1>
        <p className="text-text-secondary text-[14px] mb-8">Last Updated: July 5, 2026</p>

        <section className="mb-8">
          <h2 className="text-text-primary text-[20px] font-bold mb-4">1. Data Minimization & On-Chain Privacy</h2>
          <p className="text-text-muted text-[15px] leading-relaxed mb-4">
            tether.arena is built on a philosophy of data minimization. We do not require traditional KYC (Know Your Customer) documentation to use the platform. However, be aware that blockchain transactions are inherently public. Your wallet address, token balances, and conditional tipping history are permanently recorded on public ledgers and visible to anyone.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-text-primary text-[20px] font-bold mb-4">2. Social Account Linking</h2>
          <p className="text-text-muted text-[15px] leading-relaxed mb-4">
            To facilitate human-readable tipping commands, you may choose to link social accounts (e.g., X, Discord, Telegram) to your wallet address. When you do so:
          </p>
          <ul className="text-text-muted text-[15px] list-disc pl-5 mb-4 flex flex-col gap-2">
            <li>We store an encrypted mapping of your social ID to your wallet address.</li>
            <li>We do not request, receive, or store your social account passwords.</li>
            <li>We do not post on your behalf without your explicit command interaction with our bots.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-text-primary text-[20px] font-bold mb-4">3. Google Drive Backups</h2>
          <p className="text-text-muted text-[15px] leading-relaxed mb-4">
            If you utilize our seamless wallet creation, the generated encrypted wallet data is stored directly in your personal Google Drive account. We do not maintain a centralized database of user wallet backups. We cannot recover your wallet if you lose access to your Google account.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-text-primary text-[20px] font-bold mb-4">4. Usage Analytics</h2>
          <p className="text-text-muted text-[15px] leading-relaxed mb-4">
            We collect anonymized, aggregated usage data to improve the performance and routing of the application interface. This data is not sold to third parties and is used strictly for internal protocol optimization and maintaining the reliability of the conditional tipping engine.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-text-primary text-[20px] font-bold mb-4">5. Third-Party Services</h2>
          <p className="text-text-muted text-[15px] leading-relaxed mb-4">
            The platform utilizes third-party infrastructure providers (e.g., RPC nodes, sports data oracles, cross-chain bridges). Your use of the engine may subject your data to the privacy policies of these underlying network providers.
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
