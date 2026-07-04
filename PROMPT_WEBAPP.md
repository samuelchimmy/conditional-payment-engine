# Build Prompt — Web App (Next.js)
## Tether Arena — Fan Conditional Payment Interface

> **Wallet UX principle**: Wallet creation is the primary, recommended entry point. Google Drive encrypted backup (AES-GCM, `appDataFolder`) fires automatically right after PIN creation. This is what makes "sign in with Google" work seamlessly on any new device — the encrypted blob is fetched and decrypted with the user's PIN. Model this exactly on the MoniPay implementation.

---

## Stack
- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Blockchain reads**: viem (Celo mainnet + Alfajores testnet)
- **Backend**: Supabase JS client (auth + realtime + RPC calls)
- **WDK**: `@tether/wdk` for wallet creation + signing
- **State**: Zustand (global wallet/user state), React Query (server state)
- **Animations**: Framer Motion
- **Bridge**: Across Protocol SDK (`@across-protocol/app-sdk`) for cross-chain USDT deposits
- **Design**: Install and follow the `design-taste-frontend` skill before writing any UI code

> **Install design skill first**: Read `.agents/skills/design-taste-frontend/SKILL.md` and apply its audit-first approach. The design must feel precision-engineered and premium — a fintech app built by Tether, not a generic SaaS UI.

---

## Design System — Tether Wallet Style

> This app must look and feel like it was built **by Tether**. Study the reference screenshots from `wallet.tether.io`. High precision, high fidelity, premium. Not a startup side project. A Tether product.

### Color Palette

| Role | Value | Usage |
|---|---|---|
| **Background primary** | `#0A0A0A` | Page backgrounds, cards |
| **Background elevated** | `#111111` | Modal surfaces, navbar |
| **Background subtle** | `#1A1A1A` | Input fields, secondary cards |
| **Border** | `#2A2A2A` | Card borders, dividers |
| **Silver/Muted** | `#888888` | Secondary text, labels, icons |
| **White** | `#F2F1EF` | Primary text (exactly the color Tether uses) |
| **Orange accent** | `#F7931A` | Primary CTAs, winning states, highlights |
| **Orange dim** | `#C27315` | Hover states on orange buttons |
| **Silver accent** | `#C0C0C0` | Secondary buttons, outlines |
| **Error** | `#E84142` | Errors, failed states |
| **Success** | `#26A17B` | Claimed, settled, confirmed |

### Typography — Sharp Grotesk (Tether's Actual Font)

Tether wallet.tether.io uses **Sharp Grotesk** (confirmed from source HTML). This is a licensed font — use Google Fonts alternatives that match exactly:

```css
/* Option A: Self-host Sharp Grotesk if licensed (ask client) */
@font-face {
  font-family: 'SharpGrotesk';
  src: url('/fonts/SharpGrotesk-Bold20.otf') format('opentype');
  font-weight: 700;
}
@font-face {
  font-family: 'SharpGrotesk';
  src: url('/fonts/SharpGrotesk-Medium20.otf') format('opentype');
  font-weight: 500;
}
@font-face {
  font-family: 'SharpGrotesk';
  src: url('/fonts/SharpGrotesk-Book20.otf') format('opentype');
  font-weight: 400;
}

/* Option B: Google Fonts closest match (free alternative) */
/* Use 'Schibsted Grotesk' — also loaded by wallet.tether.io */
@import url('https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap');
```

**Font usage rules** (matching Tether exactly):
- **Display/Hero headings**: Sharp Grotesk Bold, very large (48px–72px), tight letter-spacing (`-0.02em`), white `#F2F1EF`
- **Section headings**: Sharp Grotesk Bold, 28px–36px, tight tracking
- **Body / labels**: Schibsted Grotesk Regular 400, 14px–16px, silver `#888888`
- **Numbers (amounts)**: Sharp Grotesk Bold, tabular-nums (`font-variant-numeric: tabular-nums`), white
- **UI labels / captions**: Schibsted Grotesk 500, 11px–13px, uppercase + wide tracking for secondary labels
- **Never use**: Inter, Outfit, or any round geometric sans. The Tether aesthetic is angular, precise, high-contrast.

### Design Language

**Studied from wallet.tether.io and Tether wallet app UI:**

- **Background**: Pure black `#0A0A0A`. No gradients on background. The darkness is absolute.
- **Cards**: Slightly elevated `#111111` with a `1px` border in `#2A2A2A`. Rounded corners: `12px`.
- **Buttons (primary)**: Solid orange `#F7931A`, full-width where appropriate, `height: 52px`, `border-radius: 10px`, bold label in black. On hover: darken to `#C27315`. The Tether wallet app uses this exact orange CTA pattern.
- **Buttons (secondary)**: `1px` border `#888888`, transparent fill, white text. Pill or rounded-rect shape.
- **Inputs**: `background: #1A1A1A`, `border: 1px solid #2A2A2A`, `border-radius: 10px`, white text. On focus: border becomes `#F7931A`.
- **Numbers**: Extremely large for amounts (the Tether wallet "$1,583.70" hero number style). Use tabular lining figures. Left-align amounts always.
- **Status badges**: Small pill — `Pending` (silver outline), `Won` (green fill), `Lost` (red fill), `Refunded` (silver fill), `Disputed` (orange fill).
- **Spacing**: Generous. 24px inner card padding minimum. 16px between list items. 40px section gaps.
- **Icons**: Thin-line style (stroke: 1.5px), white or silver. No filled icon sets.
- **Micro-animations**: Subtle. Number counting animation on balance change. Pulse dot for live status. Framer Motion `spring` transitions. Nothing bouncy or playful — this is a precision financial app.
- **QR codes**: White on black background, with the Tether Arena logo overlaid in the center (referencing the Tether wallet QR UI).

### Do Not / Anti-Patterns
- ❌ No electric green — that was the old design. This is orange, silver, white, black.
- ❌ No glassmorphism or frosted backgrounds.
- ❌ No rounded pill buttons for primary actions (use `border-radius: 10px`, not `9999px`).
- ❌ No colorful gradients on backgrounds.
- ❌ No Inter or Outfit fonts.
- ❌ No blue accent colors.
- ✅ Precision, weight, darkness, and orange as the single accent color.

---


## Pages & Routes

### `/` — Home / Feed
**Purpose**: The entry point. Convince a non-crypto fan that this is for them.

**Layout**:
- **Header**: Logo + "Connect / Sign in with X" CTA + wallet balance pill (shows USDT balance, hidden until connected)
- **Live Ticker**: Horizontal scrolling strip showing matches happening now or in the next 24h. Each card: "🇳🇬 Nigeria vs Brazil 🇧🇷 · Kickoff in 2h 14m". Clicking opens the Place Bet modal.
- **Active Bets Feed**: Masonry or card grid of publicly visible active conditional bets (sender @handle → recipient @handle · amount · condition · status badge). Real-time updates via Supabase realtime.
- **How It Works**: Three-step illustration. Step 1: "Say it in plain text". Step 2: "Funds lock automatically". Step 3: "Winner gets paid when the match ends". No blockchain jargon anywhere.
- **Footer**: Links to /claim, /dashboard, GitHub repo, Celo Explorer

**Components**:
- `<MatchTicker />` — live horizontal scroll, auto-refreshes every 60s
- `<BetCard />` — status-aware card (pending / won / lost / refunded / disputed)
- `<HowItWorks />` — three-step animation

---

### `/place` — Bet Composer
**Purpose**: Place a conditional payment in natural language.

**Layout**:
- **Large text input** (full width, 2-line textarea): placeholder: `"Send 10 USDT to @jade if Nigeria beats Brazil"`. This is the hero element of the page.
- **AI parsing indicator**: As the user types (debounced 800ms), call the `/api/parse-intent` endpoint. Show a subtle "Parsing..." spinner, then display a structured preview card below the input:
  ```
  📤 You send: 15 USDT
  👤 To: @jade (via MagicPay if no wallet)
  🏟️ Condition: Nigeria beats Brazil (WC2026)
  📅 Match: July 9, 20:00 UTC · Group L
  💰 Fee: 0.15 USDT (1%)
  🔒 Funds unlock: immediately if Nigeria loses
  ```
- **Recipient status chip**: If @jade has a registered wallet → "✅ Registered". If not → "📬 Will be sent via MagicPay (they claim later)".
- **Connect / Approve / Send button**: Single CTA that steps through: (1) connect wallet or sign in with X, (2) approve USDT allowance if needed, (3) submit.
- **Recent matches shortcut**: Below the input, show 6 upcoming match chips. Clicking auto-fills a bet template: "Send [amount] to [last recipient] if [team] wins".

**API call**: `POST /api/create-conditional` — validates intent, creates job in Supabase, calls executor to lock escrow on-chain.

**Error states**:
- Unrecognised team → show suggestion: "Did you mean 'Nigeria' (Super Eagles)?"
- Insufficient balance → "You have 8.00 USDT. Top up on [Celo Bridge link]."
- Recipient not found on any platform → "We'll hold it via MagicPay until @handle shows up."

---

### `/connect` — Wallet Creation & Onboarding
**Purpose**: The primary wallet entry point. Present wallet creation prominently as the recommended path.

**Layout** (recommended-first design):
- **Hero CTA (top, large)**: "Create your wallet" — described as "30 seconds. No crypto experience needed."
- Below: small secondary link: "Connect existing Celo wallet"

**Wallet creation wizard:**
1. **Set PIN** — 6-digit numeric. Warning: "This encrypts your wallet. There is no reset."
2. **Back up to Google Drive** — Large green primary button: "Back up now". Subtitle: "Sign in with Google once. Restore your wallet on any device, anytime." This fires immediately after PIN creation. Encrypts with AES-256-GCM using PIN-derived key, uploads to `appDataFolder`. On success show: "✅ Backed up to Google Drive".
3. **Recovery phrase** — Shown as a fallback step AFTER Drive backup. "Here's your 12-word backup phrase. Store it offline."
4. **USDT Allowance** — Approve IOURegistryV3 to spend USDT. One-time. Done.

**Returning user (Google restore flow):**
- User visits on a new device, taps "Sign in with Google"
- App fetches the encrypted blob from their Drive `appDataFolder`
- Prompts for PIN only
- Wallet decrypted and restored — no seed phrase needed

**Critical UX**: The Google Drive backup step must feel like a feature, not a warning. Copy: "Your wallet, safe in your Google Drive. Restore instantly on any device."

---

### `/deposit` — Fund Wallet
**Purpose**: Get USDT into the user's Celo wallet. Two paths.

**Option A — Direct Deposit:**
- Show Celo wallet address + QR code
- Chain/token table: USDT on Celo
- Deposit detection: poll balance every 10s, animate confirmation when received

**Option B — Cross-Chain Bridge (Across Protocol):**

> **Port directly from MoniPay** — the complete reference implementation is in `paytag-duo-flow/src/components/FundWalletModal/CrossChainDeposit.tsx`. Use that file as-is, adapted to the Tether Arena theme. Key details below.

**How it works** (MoniPay's exact implementation):
- Uses the **Across REST API directly** (`https://app.across.to/api`) — no SDK dependency
- `GET /api/swap/approval?tradeType=exactInput&inputToken=...&outputToken=CELO_USDT&originChainId=...&destinationChainId=42220&amount=...&depositor=...&recipient=CELO_WALLET`
- Response includes: `approvalTxns[]` (ERC-20 approvals, if needed), `swapTx` (the bridge tx), `expectedOutput`, `estimatedFillTimeSec`
- Execute: send approvals first → send bridge tx → poll `GET /api/deposit/status?depositTxHash=...&originChainId=...` until `status === 'filled'`
- Polling: 2-second interval, max 60 iterations (~2 minutes), then show success anyway (funds in transit)

**15 source chains supported** (copy token map from MoniPay):
Ethereum, Arbitrum, Optimism, Base, BNB Chain, Polygon, zkSync Era, Mode, World Chain, Blast, Linea, Scroll, Lisk, Ink, Zora

**Destination**: always Celo mainnet (chainId `42220`), token = `0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e` (native USDT on Celo)

**Wagmi setup** (same as MoniPay):
- `useAccount` / `useConnect` / `useDisconnect` from wagmi for external wallet connection
- `sendTransaction` + `waitForTransactionReceipt` from `@wagmi/core` for execution
- `switchChain` to auto-switch to the correct source chain before bridging
- Show wallet picker (MetaMask, Rabby, Phantom, WalletConnect, Coinbase, Trust) with `@web3icons/react` icons

**Step machine** (replicate exactly from MoniPay):
```
'select' → 'connect-wallet' → 'review' → 'executing' → 'success' | 'error'
```

**3-phase execution progress UI** (during `executing` step):
```
[ Approving ✓ ] → [ Bridging Assets ⟳ ] → [ Confirming ]
```
Each phase has an icon and active/done state. Tether Arena theme: use orange `#F7931A` for active phase pill, green `#26A17B` for completed.

**Quote display** (in `review` step):
```
Send:       100 USDC   (from Arbitrum)
Bridge Fee: ~$0.42
You Receive: ~99.58 USDT (on Celo)
Est. Time:  ~5s ⚡
```

**ENV required**: none — uses the public Across API. No API key needed.

---

### `/claim` — MagicPay Claim Flow
**Purpose**: Let someone who has never used crypto claim USDT sent to their social identity.

**Steps** (wizard UI):
1. **"You have USDT waiting"** — shows amount + from whom + condition that was met. CTA: "Claim Now".
2. **"Verify it's really you"** — Twitter OAuth / Discord OAuth button. After auth, backend confirms the social ID matches the `recipientId` hash stored in the contract.
3. **"Create your wallet"** (if no wallet exists) — **This is the primary recommended path. Present it prominently.**
   - User sets a **6-digit PIN** (AES-256-GCM key derivation — shown with a clear warning: "No PIN reset. Don't forget this.")
   - **Immediately after PIN**: prompt Google Drive backup. Button: "Back up to Google Drive" (large, green, primary CTA). This uploads the AES-GCM encrypted wallet blob to the user's private `appDataFolder`. This is what allows seamless restore on any device by signing in with Google + entering PIN.
   - After Drive backup confirmed: show 12-word recovery phrase as a secondary fallback option.
   - Or: "I already have a Celo wallet" → paste/connect address (secondary option, shown below the create path).
4. **"Claiming..."** — loading screen while edge function calls `claimConditional` on-chain. Shows transaction hash with CeloScan link (optional).
5. **"Claimed! 🎉"** — confetti animation. Shows balance. Option to send to another platform or keep in app.

**Critical UX rules**:
- Never show the word "blockchain", "smart contract", or "gas" to the user.
- Never show a raw transaction hash as the primary confirmation. The confirmation is "Your 15 USDT is now yours."
- The mnemonic phrase step must have a "copy" button and a warning: "Save these 12 words. We cannot recover them." This is the only moment of Web3 friction — treat it carefully.

---

### `/dashboard` — My Bets
**Purpose**: Overview of all the user's conditional bets.

**Tabs**: Active · Won · Lost · Sent (MagicPay) · Received

**Each bet row shows**:
- Match: "Nigeria 🆚 Brazil"
- Condition: "Nigeria wins"
- Amount: 15.00 USDT
- Recipient: @jade
- Status badge: Pending / Won 🏆 / Lost 💔 / Claimed / Refunded / Disputed ⚠️
- Time: "Resolves ~July 9"
- Action button: "Refund" (if eligible) or "View on CeloScan"

**Refund eligibility indicator**: If sender won → show **"Refund" button** (green, prominent). If recipient won and < 7 days → show countdown: "Refund available in 4d 12h" (disabled button, timer ticking). If > 7 days unclaimed → show **"Refund" button** (green).

**Refund is always user-initiated via this dashboard button** — never auto-triggered. This keeps the user in control and makes the USDT-denominated gas cost (CIP-64) visible and explicit before they confirm. The button calls the `refund-conditional` edge function which pre-checks eligibility before submitting the on-chain transaction.

**Live updates**: Supabase realtime subscription on `scheduled_jobs` filtered by `sender_id`.

---

### `/admin` — Plugin & Oracle Management (authenticated, admin only)
**Purpose**: Let the operator add new condition types without code deployment.

**Sections**:
1. **Active Plugins**: Table of loaded condition plugins (name, version, status, last evaluated). Toggle enable/disable.
2. **Add Plugin**: Form to add a `custom_api` plugin. Fields: Name, Endpoint URL, HTTP method, Headers (key-value pairs), JSON path, Expected value, Poll interval (minutes).
3. **Oracle Status**: Shows last 5 sync cycles. Primary source, secondary source, disputes if any.
4. **Fee Config**: Current feeBps + minFee. Owner-only update.

---

## API Routes (`/app/api/`)

### `POST /api/parse-intent`
**Input**: `{ text: string, platform: 'web' }`
**Output**: `{ intentType, amount, currency, recipient, condition, confidence, preview }`
Calls the AI agent parser (Gemini 2.5 Flash) and returns the structured intent. Used for the live preview while typing. Does NOT create any job or on-chain transaction.

### `POST /api/create-conditional`
**Input**: `{ text, senderAddress, senderSocialId, platform }`
**Auth**: Supabase session required
**Flow**: Parse intent → validate → check balance/allowance → insert job → call executor to lock escrow → return `{ jobId, iouId, txHash }`

### `POST /api/claim`
**Input**: `{ socialPlatform, socialToken (OAuth), claimantAddress }`
**Auth**: OAuth verification
**Flow**: Verify OAuth → match social ID to recipientId hash → call `claim-social-funds` edge function → return `{ txHash, amount }`

### `GET /api/matches`
**Output**: Current + upcoming WC2026 matches from `sports_match_results`. Cached 60s.

### `GET /api/bets/[userId]`
**Output**: All conditional jobs for the given user, paginated.

---

## Invisible Web3 Rules (must not violate)

1. Never show "0x..." addresses to regular users. Show "@handle" instead.
2. Never show raw transaction hashes as primary UX. They are always secondary, behind a "View Details" toggle.
3. Never say "gas". If gas is relevant, say "network fee" and pre-pay it transparently.
4. Never say "smart contract". Say "automated escrow".
5. Never ask users to switch networks. The app is Celo-only, silently.
6. Never show Wei or BigInt values. Always format as "15.00 USDT".
7. "Blockchain" is allowed in the About/FAQ page only.

---

## Key Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=          # server-side only
NEXT_PUBLIC_CELO_RPC=https://forno.celo.org
NEXT_PUBLIC_IOU_REGISTRY_V3=   # deployed contract address
NEXT_PUBLIC_USDT_CELO=0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e
GEMINI_API_KEY=                # server-side only, Gemini 2.5 Flash
TWITTER_CLIENT_ID=             # OAuth for claim flow
TWITTER_CLIENT_SECRET=
```
