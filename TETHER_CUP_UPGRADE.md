# Tether Developers Cup Hackathon Proposal: "Tether Arena"
## Architectural Upgrade Blueprint — WDK Track

This document outlines the technical upgrade to transform our existing **Conditional Sports P2P** and **MagicPay IOU Registry** engines into a competitive, single-track entry for the **Tether Developers Cup**, built entirely on the **Wallet Development Kit (WDK)**.

---

## 1. Why WDK Is Our Track

Our app already has the hard parts done:
- An on-chain escrow system (`IOURegistry`) that locks USDt to social identities.
- A claim verification engine that verifies social identity ownership and releases funds.
- A conditional sports payment engine that fires payouts automatically when match outcomes are resolved.

What we are upgrading is the **wallet layer**. Currently, MoniPay generates and encrypts private keys locally with a PIN (AES-256-GCM), and a centralized relayer wallet pays gas. This makes the system non-standard and means users never truly "hold their own keys" in the WDK sense.

By integrating **WDK**, we give users full, standard self-custody: seed phrases they control, keys that never leave their device, and native USDt/USAt management — while keeping our existing conditional payment and MagicPay logic intact underneath.

---

## 2. Architecture Overview

```text
  +-------------------------------------------------------------------+
  |                        FAN DEVICE (PWA / App)                     |
  |                                                                   |
  |  +------------------------+       +---------------------------+   |
  |  |    USER INTERFACE      |       |        WDK CLIENT         |   |
  |  |                        |       |  (Wallet Development Kit) |   |
  |  |  - Place Prediction    |       |                           |   |
  |  |    "Send $10 to @sam   |◀─────▶│ - Seed phrase generation  |   |
  |  |    if Nigeria wins"    |       | - Local key storage       |   |
  |  |                        |       | - USDt / USAt balances    |   |
  |  |  - MagicPay Claim UI   |       | - Transaction signing     |   |
  |  |                        |       | - ERC20 approval signing  |   |
  |  +──────────┬─────────────+       +─────────────┬─────────────+   |
  |             │                                   │                 |
  +─────────────┼───────────────────────────────────┼─────────────────+
                │                                   │
                ▼                                   ▼
  +-------------------------------------------------------------------+
  |                  IOURegistryV2 (Multi-chain)                      |
  |          Base · BSC · Celo · Ink                                  |
  |                                                                   |
  |  executeCreate(from, amount, recipientId)                         |
  |    → Locks net USDt into escrow. Takes fee to treasury.           |
  |                                                                   |
  |  batchClaim(iouIds, claimant, recipientId)                        |
  |    → Vault releases escrowed USDt to verified claimant.           |
  +-------------------------------------------------------------------+
                │
                ▼
  +-------------------------------------------------------------------+
  |              3-Source Consensus Sports Oracle                     |
  |                                                                   |
  |  football-data.org  +  API-Football  +  openfootball             |
  |         ↓                   ↓                 ↓                  |
  |              2-of-3 Agreement Required                            |
  |         ↓                                                         |
  |  Evaluate conditional job → Fire or Cancel WDK-signed payout     |
  +-------------------------------------------------------------------+
```

---

## 3. WDK Integration Points

### 3.1 Replacing the PIN-Based Key System
**Before**: MoniPay generates a random private key and encrypts it with the user's PIN locally using AES-256-GCM. A centralized relayer wallet signs and submits every transaction on the user's behalf, paying gas from a funded platform wallet.

**After (WDK)**: 
- WDK generates a standard BIP-39 seed phrase on device during onboarding. The user sees and owns this seed phrase.
- WDK derives all signing keys locally. The user signs transactions directly from their own account.
- Gas sponsoring (where needed) is handled through WDK's supported account abstraction layer rather than a platform-owned relayer.

```typescript
import { WalletClient } from '@tether/wdk';

// Onboarding: generate self-custodial wallet
const wallet = WalletClient.create({ network: 'base' });
const { mnemonic, address } = wallet.generate();

// User signs the ERC20 approval for IOURegistry themselves
const approvalTx = await wallet.signAndSend({
  to: USDT_ADDRESS,
  data: encodeApprove(IOU_REGISTRY_V2, amount)
});
```

---

### 3.2 Conditional Payment Signing Flow

When a user creates a sports prediction (e.g. *"Send 15 USDt to @jade if Nigeria wins Brazil"*), the WDK client:

1. **Parses the intent** (team names, outcome type, amount, recipient).
2. **Checks local WDK balance** for sufficient USDt and existing ERC20 allowance.
3. **Signs an ERC20 approval** transaction locally — no relayer sees the private key.
4. **Creates the conditional job** in the database with `status = 'pending'` and the `matchId` from our sports oracle.

When the oracle resolves the match:
- If **condition met**: The WDK client (or the backend executor wallet for gas) fires the pre-authorized transfer to the recipient.
- If **condition not met**: The job is cancelled. No funds move. No lockup period.

---

### 3.3 MagicPay + WDK: Social Wallets for the Unbanked Fan

This is our standout feature for the WDK track:

**The Problem**: A sender wants to stake 20 USDt on Nigeria winning, payable to `@jade` on Twitter. But `@jade` has no crypto wallet.

**The Solution** (MagicPay + WDK):
1. Sender locks USDt in `IOURegistryV2` under `keccak256("twitter:jade_user_id")`.
2. `@jade` gets a notification. She visits the app and is prompted to create a WDK-powered self-custodial wallet in under 30 seconds.
3. She links her Twitter account (OAuth, verified).
4. The backend vault calls `batchClaim(iouIds, jadeWalletAddress, recipientId)`.
5. USDt lands in her WDK wallet — the first crypto she has ever owned.

This is real-world utility for the WDK track: **WDK as the zero-to-wallet onramp for Web2 users receiving conditional crypto payments**.

---

### 3.4 Agent Wallet: MoniBot as a WDK Agent

The **MoniBot** Twitter/Discord/Telegram bot currently uses a platform-owned executor private key to trigger on-chain transactions. Under WDK, we upgrade MoniBot to a proper **agent wallet**:

- MoniBot holds its own WDK-derived account used strictly for executing `executeCreate` on behalf of users.
- It has a configurable spending limit and cannot access funds beyond what it is explicitly authorized to handle.
- This maps directly to the **Agent Wallets** idea in the WDK track: *"bots or AI agents that hold, send, and manage USDt on their own, using WDK primitives."*

---

## 4. Hackathon Win Checklist

| WDK Judging Criteria | What We Ship |
|---|---|
| **Real use of WDK** | Wallet creation, signing, account management, ERC20 approvals all through WDK. |
| **Technical ambition** | On-chain conditional escrow + social identity hashing + 3-source oracle + WDK agent bot. |
| **User experience** | Fans place bets in natural language. Recipients claim USDt with no prior crypto experience. |
| **Real-world use** | World Cup 2026 fan rewards, zero-wallet-required gifting, creator tipping for correct predictions. |
| **Creativity** | Conditional P2P + MagicPay social escrow is unlike any other prediction market — no liquidity pools, no lockups. |
