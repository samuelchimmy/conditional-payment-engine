# Tether Arena — Web App

The self-custodial wallet + escrow interface for [Tether Arena](../README.md). Built with Next.js 16 (App Router), React 19, wagmi/viem, and the Tether **Wallet Development Kit (WDK)**.

## What it does

- **Create a self-custodial wallet** in ~30 seconds via WDK (BIP-39 seed, encrypted cloud backup).
- **Deposit / withdraw USDT** on Celo, with live on-chain balance + transaction history.
- **Claim MagicPay winnings** — verify a linked social account and receive escrowed USDT.
- **Approve the tipping allowance** the AI agent uses to place conditional payments.

Conditional bets themselves are placed through the multi-platform bot (X / Discord / Telegram); this app is the wallet, dashboard, and claim surface.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev                  # → http://localhost:3000
```

### Environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project (edge functions gateway) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google Drive encrypted seed backup |
| `NEXT_PUBLIC_DISCORD_CLIENT_ID` | Discord account linking (OAuth) |
| `NEXT_PUBLIC_CELOSCAN_API_KEY` | Deposit/withdrawal history (Celoscan API) |

## Build

```bash
npm run build && npm start
```

See the [root README](../README.md) for the full architecture, contract, and security model.
