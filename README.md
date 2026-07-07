<div align="center">

<img src="https://em-content.zobj.net/source/apple/391/soccer-ball_26bd.png" width="80" height="80" />

# Tether Arena

**Put Your Money Where Your Mouth Is.**

AI-powered conditional USDT payments for football fans, settled on-chain.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Chain: Celo](https://img.shields.io/badge/Chain-Celo-35D07F)](https://celo.org)
[![Token: USDT](https://img.shields.io/badge/Token-USDT-26A17B)](https://tether.to)
[![Wallet: WDK](https://img.shields.io/badge/Wallet-WDK-26A17B)](https://wdk.tether.io)
[![Built for: Tether Developers Cup](https://img.shields.io/badge/Built%20for-Tether%20Developers%20Cup-green)](https://cup.tether.io)

**🌐 [tarena.xyz](https://tarena.xyz) · 📹 [Demo Video](#demo) · 🏆 Tether Developers Cup — WDK Track**

</div>

---

> ```
> @TetherArena send 15 USDT to @jade if Nigeria beats Brazil
> ```
> The AI parses the intent, locks 15 USDT in self-custodial escrow on Celo, waits for the match to settle, and pays @jade automatically if Nigeria wins — or refunds the sender if they don't. **No prediction markets. No odds. No liquidity pools. No blockchain knowledge required.**

---

## 📹 Demo

> **▶️ Watch the 60-second demo:** [YouTube link —soon]

*(gif)*

---

## What Is Tether Arena?

**Tether Arena** is an AI-powered conditional payment engine for football fans. A fan writes a bet in plain language on Telegram, Discord, or X, and the money locks in USDT escrow instantly, settles automatically when the match ends, and pays the winner — without either party needing to understand wallets, gas, or crypto.

Three ideas make it work:

### 1. Conditional P2P Escrow
Lock USDT against a match outcome. A self-custodial smart contract holds the funds; an independent multi-source oracle verifies the result; funds move automatically on settlement.

### 2. MagicPay — Social Escrow
If the recipient has no wallet, funds are locked under their **social identity hash** (`keccak256("platform:user_id")`). They claim later by verifying their account and creating a wallet in ~30 seconds — often their first-ever USDT, with no prior crypto experience.

### 3. AI-Powered Intent
Users talk naturally. The agent extracts structured intent, routes it to the correct condition plugin, and confirms or asks a clarifying question before any money moves.

---

## How It Works

```
Fan: "@TetherArena send 10 USDT to @sam if the super eagles beat brazil"
                    │
                    ▼
    ┌───────────────────────────────┐
    │   AI Intent Parser            │  → structured JSON
    │   amount: 10 USDT             │  → validated by Zod schema
    │   recipient: @sam             │  → injection-hardened
    │   condition: Nigeria wins     │
    └──────────────┬────────────────┘
                   ▼
    ┌───────────────────────────────┐
    │  Football Plugin              │  Normalizes "super eagles" → "nigeria"
    │  Finds fixture: NG vs BR      │  Returns matchId + condition payload
    └──────────────┬────────────────┘
                   ▼
    ┌───────────────────────────────┐
    │  IOURegistryV3 (Celo)         │  createConditionalIOU()
    │  10 USDT locked in escrow     │  conditionHash = keccak256(jobId)
    │  Fee → treasury               │  CIP-64: executor pays gas in USDT
    └──────────────┬────────────────┘
                   │
        [ Match plays. Nigeria wins 2-0. ]
                   ▼
    ┌───────────────────────────────┐
    │  Multi-Source Oracle          │  football-data.org · API-Football
    │  Result: NG 2-0 BR ✓          │  · openfootball — cross-checked
    └──────────────┬────────────────┘
                   ▼
    ┌───────────────────────────────┐
    │  resolveConditional() → 2     │  outcome written on-chain (immutable)
    │  claimConditional()           │  10 USDT → @sam's wallet
    └───────────────────────────────┘

Bot reply: "🏆 Nigeria won 2-0! 10 USDT was sent to @sam."
```

---

## ⚡ Quickstart

> A judge should be able to clone and run this in minutes. Setup is split into the **web app** (the WDK wallet + escrow UI) and the **agent** (the multi-platform bot + oracle).

### Prerequisites
- Node.js 22+
- A Supabase project (URL + service key)
- A Celo wallet with a little CELO for gas (for the bot executor / for WDK wallets)
- A Google AI (Gemini) API key
- Platform bot tokens for whichever channels you demo (Telegram is the simplest)

### 1. Web app
```bash
cd webapp
npm install
cp .env.example .env.local     # fill in Supabase + platform client IDs
npm run dev                     # → http://localhost:3000
```

### 2. Agent (bot + oracle)
```bash
cd bots
npm install
cp .env.example .env            # fill in Gemini, Celo keys, Supabase, bot tokens
npm start                       # boots adapters + oracle workers
```

### 3. Contract & database
The contract (`IOURegistryV3`) is already deployed on Celo (see [address](#contract)). To redeploy or run the full stack, see [`docs/`](docs/) for the Hardhat and Supabase setup.

**Environment variables** are documented in each folder's `.env.example`. The app degrades gracefully — a missing platform token disables only that adapter, not the whole agent.

---

## 🔑 WDK Integration (Wallets Track)

Tether Arena is built on the **[Wallet Development Kit](https://wdk.tether.io)**. WDK powers the entire self-custodial experience:

| WDK Capability | Where We Use It |
|---|---|
| **Wallet creation** | `WalletProvider.tsx` — a new self-custodial wallet is generated from a BIP-39 mnemonic via `WalletManagerEvm` / `SeedSignerEvm`, connected to Celo. |
| **Signing & sending** | `lib/sendTx.ts` — a unified `useSendTx()` hook routes every on-chain write (approve, escrow lock, withdraw) through the WDK account's `sendTransaction()`. The self-custodial wallet signs its own transactions — no external connector. |
| **Accounts** | `wallet.getAccount(0)` derives the account; balances and allowances are read directly from the WDK account. |
| **Encrypted backup** | `lib/googleDriveBackup.ts` — the seed is encrypted client-side with **AES-GCM + PBKDF2** (random salt/IV) before optional Google Drive backup. The user always holds their own keys. |

**Clean separation of concerns:** app/agent logic never touches raw keys. Wallet execution is isolated behind the WDK account interface, and the escrow contract enforces spending limits independently on-chain.

> **Note:** the installed WDK EVM beta signs standard Celo transactions (gas in native CELO). CIP-64 gas-in-USDT is used by the **bot executor** path via a custom viem transaction builder.

---

## 🔐 Security Architecture

Security is layered across the AI agent, the off-chain resolver, and the on-chain contract. Every claim below is implemented in this repository.

### 1. AI Agent — 4-Layer Command Pipeline
Every natural-language payment command passes through four independent gates before any money moves:

1. **Input Sanitization** — 500-char cap, Unicode homoglyph normalization, HTML/JSON stripping. (`bots/security/inputSanitizer.js`)
2. **Injection Regex Guard** — blocks known instruction-override / persona-hijack / prompt-extraction patterns *before* the LLM is called. (`bots/security/inputSanitizer.js`)
3. **Isolated LLM Extraction** — the user message is wrapped in `<user_message>` tags and treated strictly as data, not instructions. Output is JSON-only. (`bots/parser/intentParser.js`)
4. **Output Schema Validation** — every parsed command is validated against a **Zod schema**: amount cap, allowed intent types, recipient format, forbidden-handle blocklist. Schema mismatch = silently ignored. (`bots/security/outputValidator.js`, `bots/parser/intentSchema.js`)

### 2. Recipient Resolution — Anti Username-Hijacking
Handles are **not** trusted. Every recipient `@handle` is resolved to its immutable, platform-specific numeric ID (Twitter ID, Discord snowflake, Telegram ID) before any escrow lock. All database lookups and escrow locks key on this immutable ID — a user changing their handle cannot intercept pending payments. (`bots/security/recipientResolver.js`)

### 3. Identity Hashing — No Plaintext Handles On-Chain
Social identifiers are never written to Celo in plaintext. They are hashed before contract execution:
```
keccak256(abi.encodePacked(platform, ":", userId))
```
Only the 32-byte hash is recorded, preventing block explorers from mapping escrow records to real-world usernames — while still allowing deterministic verification when a user links their account.

### 4. Secure Claim — Verified Identity → Hash → Claim
MagicPay funds are locked under a recipient's identity hash. To claim, the recipient must prove ownership of the social account through verified cryptographic proof:

| Platform | Verification |
|---|---|
| **Telegram** | Server-side HMAC — widget payloads are signed with the bot token's SHA-256 hash and verified by the `social-identity` edge function. |
| **Twitter / X** | OAuth 2.0 with PKCE against X's official identity endpoints. |
| **Discord** | Confidential-client OAuth 2.0 — the code is exchanged server-side via the `discord-oauth` edge function. |

Only after the identity is verified does the vault release funds to the claimant's wallet. Every link request also validates that the active wallet session owns the profile row, and unique-handle constraints prevent double-linking.

### 5. On-Chain Contract Controls (`IOURegistryV3`)
- **UUPS upgradeable** proxy with a **48-hour upgrade timelock** (`scheduleUpgrade` → wait → upgrade).
- **Ownable2Step** ownership; owner has **no custody or withdrawal rights** over active escrow. Locked funds can only be claimed by the verified recipient or returned to the sender after expiry.
- **ReentrancyGuard** on all state-changing entrypoints.
- **Pausable** — deposits/claims can be paused in a black-swan event; escrowed funds remain safe.
- **SafeERC20** for all token movements (safe integration with USDT).
- **Role separation** — the *executor* (bot) can only create escrows, bounded by a per-tx max amount; the privileged *vault* resolves and claims. They are distinct keys.
- Compiled with **Solidity 0.8.20** (built-in overflow/underflow protection).

### 6. Off-Chain Data Protection
- All client↔edge-function traffic over **HTTPS / TLS 1.3**.
- **PostgreSQL Row-Level Security** isolates profile data to verified owners.
- Frontend never touches the database directly — all reads/writes route through authenticated Supabase **edge functions** (`db-proxy`), gated by **SIWE** wallet authentication.
- Per-user rate limiting on the agent (sliding window).

---

## Why Celo?

| Feature | Why It Matters |
|---|---|
| **CIP-64 Fee Delegation** | The bot executor pays gas in USDT — users never need to buy CELO for agent-driven flows. |
| **Native USDT** | Tether issues USDT natively on Celo — no bridge risk, no wrapped tokens. |
| **Sub-cent gas** | A 5 USDT bet doesn't lose a third to fees. Economics work at any scale. |
| **Mobile-first** | Built for emerging markets — exactly the fan demographic we serve. |
| **EVM-compatible** | Our entire viem / WDK toolchain works unchanged. |

---

## <a name="contract"></a>Contract: IOURegistryV3

**Chain**: Celo Mainnet
**Address**: `0x4708f9697c72bBBCa2ad82bbf03F2A8E0d62038C` *(verify on [CeloScan](https://celoscan.io/address/0x4708f9697c72bBBCa2ad82bbf03F2A8E0d62038C) before submission)*
**Pattern**: UUPS Upgradeable Proxy + 48h upgrade timelock

| Function | Caller | Purpose |
|---|---|---|
| `createConditionalIOU()` | Executor (bot) | Locks USDT; sends fee to treasury; stores conditionHash |
| `resolveConditional()` | Vault | Writes the outcome on-chain (immutable). Does not move funds. |
| `claimConditional()` | Vault | Pays the recipient once resolved in their favor |
| `refundConditional()` | Sender / executor | Returns funds per the refund rules below |
| `batchRefund()` | Sender | Reclaims multiple expired escrows |

### Refund Rules
```
Resolved for SENDER    → refund available immediately (condition not met)
Resolved for RECIPIENT → sender refund locked for the hold window;
                         safety valve returns funds if recipient never claims
UNRESOLVED             → refund available after expiry (postponed match / dispute)
```

**Resolve is separate from claim** so the outcome is permanently recorded on-chain even if the recipient needs time to create a wallet (MagicPay). Even if our backend disappears, users can refund or claim directly from the contract.

---

## Architecture

```
 SOCIAL PLATFORMS   Telegram · Discord · X
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                  AI AGENT  (Node.js, ESM)                    │
│  Platform Adapters → Sanitizer → Injection Guard →           │
│  LLM Intent Parse → Zod Validation → Condition Plugins       │
└─────────────────┬───────────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────────┐
│         IOURegistryV3 — Celo Mainnet (UUPS Proxy)            │
│  createConditionalIOU · resolveConditional · claimConditional│
│  refundConditional · batchRefund   (ReentrancyGuard·Pausable)│
└─────────────────┬───────────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────────┐
│         Multi-Source Oracle + Condition Plugin Engine        │
└─────────────────┬───────────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase — profiles · payments · match results             │
│  Edge Functions — auth · db-proxy · social-identity · claim  │
└─────────────────┬───────────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Web App (Next.js) — WDK self-custodial wallet + escrow UI   │
│  /connect · /dashboard · claim · deposit                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Web app** | Next.js 16 (App Router), React 19, Tailwind v4, wagmi + viem |
| **Wallet** | `@tetherto/wdk` + `@tetherto/wdk-wallet-evm` (self-custodial, Celo) |
| **Agent** | Node.js 22 (ESM), viem, Gemini 2.5 Flash, Zod |
| **Platforms** | `twitter-api-v2`, `discord.js` v14, `node-telegram-bot-api` |
| **Backend** | Supabase (Postgres + RLS + Edge Functions) |
| **Contract** | Solidity 0.8.20, OpenZeppelin Upgradeable (UUPS) |

---

## Repository Structure
```
tether-arena/
├── webapp/            ← Next.js app: WDK wallet + escrow UI
├── bots/              ← AI agent: platform adapters, parser, oracle, plugins
├── contracts/         ← IOURegistryV3.sol (UUPS upgradeable escrow)
├── supabase/          ← migrations + edge functions
├── docs/              ← build specs & architecture deep-dives
├── LICENSE            ← MIT
└── README.md
```

---

## Placing a Bet (Examples)

**Telegram**
```
/bet Send 20 USDT to @sam if Morocco draw France
```
**Discord**
```
/bet send 15 USDT to @jade if Nigeria beats Brazil
```
**X / Twitter**
```
@TetherArena send 10 USDT to @sam if Nigeria beats Brazil
```

---

## Prior Work Disclosure

This project builds on our existing MoniPay / MoniBot codebase. Reused components:
- Base escrow patterns and multi-source sports oracle (refactored for conditional logic + AI).
- Multi-chain viem utilities (Celo CIP-64 additions are new).

Built during the Tether Developers Cup:
- `IOURegistryV3.sol` — upgradeable, conditional escrow, dynamic refund rules, 48h upgrade timelock.
- AI intent parser with injection-hardened 4-layer pipeline.
- Condition plugin system.
- Next.js web app with full WDK self-custodial wallet integration.
- Supabase schema + edge functions for conditional IOUs and secure claim.

---

## License

MIT — see [LICENSE](LICENSE).

---

*Built for the [Tether Developers Cup 🏆](https://cup.tether.io) — WDK Track*
