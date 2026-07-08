import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="w-full max-w-[800px] flex flex-col pt-8 pb-24 px-4 mx-auto">
      <div className="mt-4 sm:mt-12 bg-surface border border-border rounded-[16px] p-5 sm:p-8 md:p-12 prose prose-invert max-w-none">
        <h1 className="text-text-primary text-[28px] font-[800] mb-8">Privacy Policy</h1>
        <p className="text-text-secondary text-[13px] mb-8">Last Updated: July 8, 2026</p>

        <section className="mb-8">
          <h2 className="text-text-primary text-[18px] font-bold mb-4">1. Data Minimization & On-Chain Privacy</h2>
          <p className="text-text-muted text-[14px] leading-relaxed mb-4">
            tether.arena is built on a philosophy of data minimization. We do not require traditional KYC (Know Your Customer) documentation to use the platform. However, be aware that blockchain transactions are inherently public. Your wallet address, token balances, and conditional tipping history are permanently recorded on public ledgers and visible to anyone.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-text-primary text-[18px] font-bold mb-4">2. Social Account Linking</h2>
          <p className="text-text-muted text-[14px] leading-relaxed mb-4">
            To facilitate human-readable tipping commands, you may choose to link social accounts (e.g., X, Discord, Telegram) to your wallet address. When you do so:
          </p>
          <ul className="text-text-muted text-[14px] list-disc pl-5 mb-4 flex flex-col gap-2">
            <li>We store an encrypted mapping of your social ID to your wallet address.</li>
            <li>We do not request, receive, or store your social account passwords.</li>
            <li>We do not post on your behalf without your explicit command interaction with our bots.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-text-primary text-[18px] font-bold mb-4">3. Google User Data</h2>
          <p className="text-text-muted text-[14px] leading-relaxed mb-4">
            tether.arena offers optional Google sign-in to securely back up your self-custodial wallet. This section discloses exactly how we access, use, store, share, retain, and delete Google user data, in accordance with the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-text-primary underline">Google API Services User Data Policy</a> (including its Limited Use requirements).
          </p>

          <h3 className="text-text-primary text-[15px] font-bold mb-2">Data We Access</h3>
          <p className="text-text-muted text-[14px] leading-relaxed mb-2">We request only the minimum Google OAuth scopes required:</p>
          <ul className="text-text-muted text-[14px] list-disc pl-5 mb-4 flex flex-col gap-2">
            <li><strong>Email &amp; basic profile</strong> (<code>openid</code>, <code>email</code>): your email address, used to identify your backup and label the connected account.</li>
            <li><strong>Google Drive app-data folder</strong> (<code>drive.appdata</code>): a private, hidden application-data folder in your own Google Drive. This scope <em>cannot</em> see, read, or modify any of your existing Google Drive files — it can only access the single encrypted backup file our app creates.</li>
          </ul>

          <h3 className="text-text-primary text-[15px] font-bold mb-2">How We Use It</h3>
          <ul className="text-text-muted text-[14px] list-disc pl-5 mb-4 flex flex-col gap-2">
            <li>Your email is used solely to associate and display the Google account linked to your wallet.</li>
            <li>The Drive app-data folder is used solely to store one <strong>encrypted</strong> wallet backup file so you can restore your self-custodial wallet on a new device. The wallet is encrypted on your device with a key/PIN only you hold; we never receive your unencrypted keys or seed phrase.</li>
            <li>We do <strong>not</strong> use Google user data for advertising, and we do <strong>not</strong> use it to train any AI or machine-learning models.</li>
          </ul>

          <h3 className="text-text-primary text-[15px] font-bold mb-2">How We Share It</h3>
          <p className="text-text-muted text-[14px] leading-relaxed mb-4">
            We do <strong>not</strong> sell or share Google user data with third parties. The encrypted backup file resides only in your own Google Drive. Your linked email is stored in our database (see below) and is never sold, rented, or shared for marketing. Use of Google user data adheres to the Google API Services User Data Policy, including the <strong>Limited Use</strong> requirements.
          </p>

          <h3 className="text-text-primary text-[15px] font-bold mb-2">Storage &amp; Protection</h3>
          <ul className="text-text-muted text-[14px] list-disc pl-5 mb-4 flex flex-col gap-2">
            <li>The wallet backup is <strong>encrypted client-side (AES-GCM) before upload</strong> and stored only in your personal Google Drive app-data folder — we keep no copy.</li>
            <li>Your linked email is stored in our managed database (Supabase/PostgreSQL) protected by Row-Level Security, and all data is transmitted over HTTPS/TLS.</li>
            <li>OAuth access tokens are used transiently in-session to perform the backup and are not persisted on our servers.</li>
          </ul>

          <h3 className="text-text-primary text-[15px] font-bold mb-2">Retention &amp; Deletion</h3>
          <ul className="text-text-muted text-[14px] list-disc pl-5 mb-4 flex flex-col gap-2">
            <li>Your linked email is retained only while your account link is active. You can unlink Google at any time from Settings, which deletes the stored email from our database.</li>
            <li>You can delete the encrypted backup at any time from your own Google Drive (Drive → Settings → Manage Apps → tether.arena → Delete hidden app data), or by revoking access at <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-text-primary underline">myaccount.google.com/permissions</a>.</li>
            <li>To request full deletion of any data we hold, contact us via the <Link href="/support" className="text-text-primary underline">Support</Link> page; we action verified requests promptly.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-text-primary text-[18px] font-bold mb-4">4. Usage Analytics</h2>
          <p className="text-text-muted text-[14px] leading-relaxed mb-4">
            We collect anonymized, aggregated usage data to improve the performance and routing of the application interface. This data is not sold to third parties and is used strictly for internal protocol optimization and maintaining the reliability of the conditional tipping engine.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-text-primary text-[18px] font-bold mb-4">5. Third-Party Services</h2>
          <p className="text-text-muted text-[14px] leading-relaxed mb-4">
            The platform utilizes third-party infrastructure providers (e.g., RPC nodes, sports data oracles, cross-chain bridges). Your use of the engine may subject your data to the privacy policies of these underlying network providers.
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
