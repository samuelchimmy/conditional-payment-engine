# Build Prompt — Web App (Next.js)
## Tether Arena — Fan Conditional Payment Interface

---

## Stack
- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Blockchain reads**: viem (Celo mainnet + Alfajores testnet)
- **Backend**: Supabase JS client (auth + realtime + RPC calls)
- **WDK**: `@tether/wdk` for wallet creation + signing
- **State**: Zustand (global wallet/user state), React Query (server state)
- **Animations**: Framer Motion
- **Design**: Install and follow the `design-taste-frontend` skill before writing any UI code

> **Install design skill first**: Read `.agents/skills/design-taste-frontend/SKILL.md` and apply its audit-first approach. The design must feel premium, sports-themed (dark background, electric green accent, bold typography), not generic SaaS.

---

## Design Direction
- **Theme**: Dark. Deep navy/charcoal (`#0a0e1a`) background. Electric green (`#00e676`) as the primary action color. Gold (`#ffd700`) for winners. Red (`#ff4444`) for losers.
- **Font**: Outfit (headings) + Inter (body) from Google Fonts
- **Feel**: Bloomberg meets Stake.com meets Duolingo. Data-rich but human. Every bet should feel exciting, not clinical.
- **Key motif**: The live match ticker at the top of every page. Always show what's happening right now.

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

### `/claim` — MagicPay Claim Flow
**Purpose**: Let someone who has never used crypto claim USDT sent to their social identity.

**Steps** (wizard UI):
1. **"You have USDT waiting"** — shows amount + from whom + condition that was met. CTA: "Claim Now".
2. **"Verify it's really you"** — Twitter OAuth / Discord OAuth button. After auth, backend confirms the social ID matches the `recipientId` hash stored in the contract.
3. **"Create your wallet"** (if no WDK wallet exists) — WDK wallet creation: generate mnemonic, show 12-word phrase, confirm 3 random words. Or: "I already have a Celo wallet" → paste address.
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

**Refund eligibility indicator**: If sender won → "Refund available ✅". If recipient won and < 7 days → show countdown: "Refund available in 4d 12h". If > 7 days unclaimed → "Refund available ✅".

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
