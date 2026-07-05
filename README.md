<div align="center">
<div align="center">

<img src="https://em-content.zobj.net/source/apple/391/soccer-ball_26bd.png" width="80" height="80" />

# Tether Arena

</div>
**Put Your Money Where Your Mouth Is..** 

AI powered Conditional USDT payments for football fans, settled onchain.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Chain: Celo](https://img.shields.io/badge/Chain-Celo-35D07F)](https://celo.org)
[![Token: USDT](https://img.shields.io/badge/Token-USDT-26A17B)](https://tether.to)
[![Built for: Tether Developers Cup](https://img.shields.io/badge/Built%20for-Tether%20Developers%20Cup-green)](https://cup.tether.io)

---

</div>

## What Is Tether Arena?
**Tether Arena** is the first AI-powered conditional payment engine for football. A fan types a bet in plain language on X, Discord, or Telegram, and the money locks in USDT escrow instantly, settles automatically when the match ends, and pays the winner without either party touching a wallet.

Tether Arena lets football fans make conditional USDT payments in plain language — on X, Discord, or Telegram — and the money moves automatically when the match settles.

```
@TetherArena send 15 USDT to @jade if Nigeria beats Brazil
```

That's it. The AI agent parses the intent, locks 15 USDT in escrow on Celo, waits for Nigeria vs Brazil to finish, and — if Nigeria wins — pays @jade automatically. If Nigeria loses, the 15 USDT goes back to the sender immediately.

No prediction markets. No liquidity pools. No odds. No blockchain knowledge needed. Just conditional escrow and an AI agent living in your social feed.

---

## Core Ideas

### 1. Conditional P2P
Lock USDT against a match outcome. The contract holds funds; the oracle verifies the result from 3 independent sources; funds move automatically.

### 2. MagicPay (Social Escrow)
If the recipient has no wallet, funds are locked under their social identity hash (`keccak256("twitter:user_id")`). They claim it later by verifying their account — their first-ever USDT, no prior crypto experience needed.

### 3. AI-Powered Intent Parsing
Users talk naturally. Gemini 2.5 Flash extracts structured intent, routes it to the correct condition plugin, and the agent confirms or asks a clarifying question. English, Pidgin, Spanish, French — all supported.

---

## How It Works

```
Fan tweets: "@TetherArena send 10 USDT to @sam if the super eagles beat brazil"
                    │
                    ▼
    ┌───────────────────────────────┐
    │   AI Intent Parser            │  Gemini 2.5 Flash
    │   amount: 10 USDT             │  → structured JSON
    │   recipient: @sam             │  → validated by Zod
    │   condition: Nigeria wins     │
    └──────────────┬────────────────┘
                   │
                   ▼
    ┌───────────────────────────────┐
    │  Football Plugin              │  Normalizes "super eagles" → "nigeria"
    │  Finds fixture: NG vs BR      │  Returns matchId + conditionPayload
    │  Outcome: home_win required   │
    └──────────────┬────────────────┘
                   │
                   ▼
    ┌───────────────────────────────┐
    │  IOURegistryV3 (Celo)         │  createConditionalIOU()
    │  10 USDT locked in escrow     │  conditionHash = keccak256(jobId)
    │  Fee: 0.10 USDT → treasury    │  CIP-64: gas paid in USDT
    └──────────────┬────────────────┘
                   │
        [ Match plays. Nigeria wins 2-0. ]
                   │
                   ▼
    ┌───────────────────────────────┐
    │  3-Source Oracle              │  football-data.org + API-Football
    │  Consensus: NG 2-0 BR ✓       │  + openfootball — 2-of-3 agreement
    │  Stability window: 10 min     │
    └──────────────┬────────────────┘
                   │
                   ▼
    ┌───────────────────────────────┐
    │  resolveConditional()         │  resolvedInFavor = 2 (recipient)
    │  claimConditional()           │  10 USDT → @sam's wallet
    └───────────────────────────────┘

Bot reply to sender: "🏆 Nigeria won 2-0! 10 USDT was sent to @sam."
Bot DM to @sam:     "🎉 You won! @fan bet 10 USDT that Nigeria would beat Brazil. It's yours."
```

---

## Architecture

```
 SOCIAL PLATFORMS
  X · Discord · Telegram
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                  AI AGENT  (Node.js)                        │
│  Platform Adapters → Pre-Filter → Gemini 2.5 Flash          │
│  → Condition Plugin Router → Job Queue (Supabase)           │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│         IOURegistryV3 — Celo Mainnet (UUPS Proxy)           │
│  createConditionalIOU · resolveConditional                  │
│  claimConditional · refundConditional                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│         3-Source Consensus Oracle + Plugin Engine           │
│  football.plugin · x_post.plugin · custom_api.plugin        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase — profiles · scheduled_jobs · match_results       │
│  Edge Functions — create · resolve · claim · refund · notify│
└─────────────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Web App (Next.js) — Invisible Web3                         │
│  /place · /claim · /dashboard · /admin                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Why Celo?

| Feature | Why It Matters |
|---|---|
| **CIP-64 Fee Delegation** | Users pay gas in USDT. They never need to buy CELO. True invisible web3. |
| **Native USDT** | Tether issues USDT natively on Celo — no bridge risk, no wrapped tokens. |
| **Sub-cent gas** | A 5 USDT bet doesn't lose 30% to fees. Economics work at any scale. |
| **Mobile-first** | Celo was built for emerging markets — exactly the fan demographic we serve. |
| **EVM-compatible** | Our entire viem/ethers toolchain works unchanged. |

---

## Contract: IOURegistryV3

**Deployed on**: Celo Mainnet — `0x[TBD after deployment]`  
**Testnet (Alfajores)**: `0x[TBD after deployment]`  
**Pattern**: UUPS Upgradeable Proxy + 48h timelock on upgrades

### Key Functions

| Function | Who Calls It | What It Does |
|---|---|---|
| `createConditionalIOU()` | Executor (bot) | Locks USDT; sends fee to treasury; stores conditionHash |
| `resolveConditional()` | Vault only | Writes outcome on-chain (immutable). Does NOT move funds. |
| `claimConditional()` | Vault only | Pays recipient. Available immediately once resolvedInFavor=2 |
| `refundConditional()` | Sender or executor | Returns funds based on refund rules (see below) |
| `executeCreate()` | Executor | Standard IOU (backward-compatible with V2) |
| `batchClaim()` | Vault only | Standard IOU batch claim |

### Refund Rules

```
resolvedInFavor = SENDER_WIN (1)
  → Refund available immediately. Condition was not met. ✅

resolvedInFavor = RECIPIENT_WIN (2)
  → Refund locked for 7 days from resolvedAt.
  → After 7 days: safety valve activates if recipient never claimed. ✅

resolvedInFavor = UNRESOLVED (0)
  → Refund available after IOU expiry (covers: postponed match, oracle dispute). ✅
```

### Why Separate Resolve from Claim?

The old V2 combined resolution and payment into one atomic oracle transaction. V3 separates them:

1. **Resolve** (vault, once): writes the outcome to the blockchain permanently. This is tamper-evident proof of who won.
2. **Claim** (vault, on behalf of recipient): transfers funds. Can happen asynchronously — recipient may need to create a wallet first (MagicPay flow).
3. **Refund** (sender-triggered): always verifiable on-chain without relying on our backend.

This means even if our backend disappears, users can interact with the contract directly to claim or refund.

---

## AI Agent

### Intent Parser

The agent uses **Gemini 2.5 Flash** with structured JSON output (no JSON parsing errors) and low temperature (0.1) for deterministic, consistent extractions.

**Languages supported**: English, Nigerian Pidgin, Yoruba, Hausa, Igbo, French, Spanish, Portuguese, and more — the LLM handles language detection automatically.

**Security**:
- System prompt explicitly classifies injection attempts
- All output validated against a Zod schema — if it fails, the message is silently ignored
- Rate limits: 10 bets per user per 24h, 3 per hour
- Amount cap: configurable max per single conditional payment
- Input sanitized (HTML stripped, max 1000 chars) before LLM sees it

### Condition Plugin System

Every condition type is a plugin implementing a standard interface. Admin can add new condition types from the Supabase dashboard without code deployment.

**Built-in plugins:**
- `football_match` — WC2026 match outcome (win / loss / draw / exact score)
- `x_post_engagement` — Twitter engagement metrics (likes, retweets, views)
- `custom_api` — Admin-configured: any JSON API as a condition source

**Add a new condition** (no code required):
1. Go to Supabase admin → `condition_plugins` table
2. Insert a row with `plugin_type = 'custom_api'` and fill the `config` JSON:
```json
{
  "endpoint": "https://api.example.com/result",
  "jsonPath": "$.data.winner",
  "expectedValue": "nigeria",
  "pollIntervalMinutes": 10
}
```
3. Agent hot-reloads via Supabase realtime. New condition type is live.

---

## MagicPay — Social Escrow

The recipient has no wallet? No problem.

1. Sender locks USDT under `keccak256("twitter:recipient_user_id")`
2. Recipient gets a notification: *"You have 15 USDT waiting. Tap to claim."*
3. They visit the web app, create a WDK wallet in 30 seconds (or connect existing)
4. They verify their social account via OAuth
5. Vault calls `claimConditional` → USDT lands in their wallet
6. This may be their first-ever crypto. They didn't need to buy CELO or understand gas.

---

## Repository Structure

```
conditional-payment-engine/
├── contracts/
│   ├── IOURegistryV3.sol          ← Main contract (UUPS upgradeable)
│   └── IOURegistryV2.sol          ← Previous version (reference only)
├── oracle/
│   ├── sportsOracle.js            ← 3-source consensus match sync
│   ├── evaluator.js               ← Job evaluation against settled matches
│   ├── resolver.js                ← On-chain resolution + claim execution
│   ├── blockchain.js              ← Celo viem clients + CIP-64 transactions
│   └── plugins/
│       ├── registry.js            ← Plugin loader (Supabase realtime)
│       ├── football.plugin.js     ← WC2026 match outcome
│       ├── x_post.plugin.js       ← X/Twitter engagement
│       └── custom_api.plugin.js   ← Admin-configured generic API
├── agent/
│   ├── index.js                   ← Entry point
│   ├── adapters/
│   │   ├── x.adapter.js
│   │   ├── discord.adapter.js
│   │   └── telegram.adapter.js
│   ├── parser/
│   │   ├── intentParser.js        ← Gemini 2.5 Flash
│   │   ├── intentSchema.js        ← Zod schema
│   │   └── preFilter.js
│   ├── handler.js                 ← Message routing
│   └── security/
│       └── rateLimiter.js
├── backend/
│   ├── claim-social-funds.ts      ← Supabase edge function
│   ├── create-conditional-iou.ts  ← Supabase edge function
│   ├── resolve-conditional.ts     ← Supabase edge function
│   └── refund-conditional.ts      ← Supabase edge function
├── webapp/                        ← Next.js 14 App Router
│   └── (see PROMPT_WEBAPP.md)
├── TETHER_CUP_UPGRADE.md          ← Full architecture deep-dive
├── PROMPT_WEBAPP.md               ← Web app build specification
├── PROMPT_AGENT.md                ← Agent backend build specification
├── PROMPT_DATABASE.md             ← Database + edge functions specification
└── HACKATHON_REQUIREMENTS.md      ← Competition rules reference
```

---

## Local Setup

### Prerequisites
- Node.js 22+
- A Supabase project
- Celo Alfajores test wallet with test CELO + test USDT
- Google AI API key (Gemini 2.5 Flash)

### 1. Clone and install

```bash
git clone https://github.com/samuelchimmy/conditional-payment-engine.git
cd conditional-payment-engine
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in all values:

```env
# Celo
CELO_RPC_URL=https://alfajores-forno.celo-testnet.org  # Alfajores for dev
EXECUTOR_PRIVATE_KEY=0x...   # Bot executor (limited: createConditionalIOU only)
VAULT_PRIVATE_KEY=0x...      # Vault (privileged: resolve + claim)
IOU_REGISTRY_V3=0x...        # After deployment

# AI
GEMINI_API_KEY=

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# X/Twitter
TWITTER_BEARER_TOKEN=
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_SECRET=

# Discord
DISCORD_BOT_TOKEN=

# Telegram
TELEGRAM_BOT_TOKEN=

# Sports APIs
FOOTBALL_DATA_API_KEY=
API_FOOTBALL_API_KEY=
```

### 3. Deploy the contract

```bash
# Install Hardhat dependencies
npm install --save-dev hardhat @openzeppelin/contracts-upgradeable

# Deploy to Alfajores testnet
npx hardhat run scripts/deploy-v3.js --network alfajores

# Verify on Celoscan
npx hardhat verify --network alfajores <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### 4. Set up Supabase

```bash
# Push schema migrations
supabase db push

# Deploy edge functions
supabase functions deploy create-conditional-iou
supabase functions deploy resolve-conditional
supabase functions deploy claim-social-funds
supabase functions deploy refund-conditional
supabase functions deploy notify-parties

# Set secrets in Supabase Vault
supabase secrets set VAULT_PRIVATE_KEY=0x...
supabase secrets set GEMINI_API_KEY=...
```

### 5. Start the agent

```bash
node agent/index.js
```

### 6. Start the web app

```bash
cd webapp
npm install
npm run dev
# → http://localhost:3000
```

---

## Placing a Bet (Examples)

### Via X/Twitter
```
@TetherArena send 10 USDT to @sam if Nigeria beats Brazil
@TetherArena if the super eagles win tonight, send @jade 25 USDT
@TetherArena envía 5 USDT a @carlos si Argentina empata España
@TetherArena abeg send 8 USDT give @bola if Nigeria chop Argentina 3-1
```

### Via Discord
```
/bet send 15 USDT to @jade if Nigeria beats Brazil
```

### Via Telegram
```
/bet Send 20 USDT to @sam if Morocco draw France
```

---

## Hackathon Track: WDK (Wallets)

**Why this wins the WDK track:**

| WDK Criterion | How We Deliver |
|---|---|
| Real use of WDK | Wallet creation, signing, accounts, ERC-20 approvals all through WDK |
| Technical ambition | Upgradeable V3 contract + CIP-64 gasless + Gemini AI agent + 3-source oracle + plugin engine |
| User experience | Natural language → zero friction → 30-second wallet creation for recipients |
| Real-world utility | WC2026 is live. These bets work right now. Unbanked fans receive USDT for the first time. |
| Creativity | No existing product has this combination. No liquidity pools. No odds. Conditional escrow + AI + social identity. |

---

## Prior Work Disclosure

This project builds on an existing MoniPay/MoniBot production codebase. Pre-existing components:
- `IOURegistryV2.sol` — basic escrow (V3 is a full redesign with conditional logic)
- `sportsOracle.js` — 3-source consensus oracle (plugin refactor and AI integration are new)
- `blockchain.js` — multi-chain viem utilities (Celo CIP-64 additions are new)

All new work built during the Tether Developers Cup:
- `IOURegistryV3.sol` — upgradeable, conditional escrow, dynamic refund rules, 48h upgrade timelock
- Gemini 2.5 Flash AI intent parser with injection-hardened system prompt
- Condition plugin system (`registry.js`, `x_post.plugin.js`, `custom_api.plugin.js`)
- Next.js web app (entire new build)
- Supabase schema redesign for conditional IOUs
- CIP-64 Celo fee delegation in all transactions

---

## License

MIT — see [LICENSE](LICENSE)

---

## Demo

📹 Demo video: [YouTube link — TBD before July 8 submission]

🔗 Live app: [TBD]

🔗 Contract on CeloScan: [TBD]

---

*Built for the [Tether Developers Cup 🏆](https://cup.tether.io) — WDK Track*
