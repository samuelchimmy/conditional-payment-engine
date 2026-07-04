# Tether Developers Cup Hackathon Proposal: "Tether Arena P2P"
## Architectural Upgrade Blueprint (WDK + QVAC + Pears)

This document provides a comprehensive technical blueprint to upgrade our existing **Conditional Sports P2P** and **MagicPay IOU Registry** engines into a premium, multi-track Web3 + AI entry for the **Tether Developers Cup**.

By fusing **WDK (Self-Custodial Wallets)**, **QVAC (Local, On-Device AI)**, and **Pears (P2P Serverless Sync)**, we eliminate central servers, remove cloud API keys, ensure absolute financial self-custody, and deliver a seamless, high-performance experience for football fans worldwide.

---

## 1. System Architecture

```text
  +-------------------------------------------------------------------------+
  |                             FAN DEVICE (PWA / Desktop)                  |
  |                                                                         |
  |  +--------------------+             +--------------------------------+  |
  |  |   USER INTERFACE   |             |            QVAC SDK            |  |
  |  |                    |             |     (Local 1B-3B LLM Engine)   |  |
  |  | - Chat / Match     |             |                                |  |
  |  |   Watch Party      |             | 1. Natural Language Intent     |  |
  |  | - Prediction Feed  |────────────▶|    "Send 20 USDt to @sam..."   |  |
  |  | - WDK Dashboard    |             |                                |  |
  |  +---------┬----------+             | 2. Local RAG Match Predictor   |  |
  |            │                        +───────────────┬────────────────+  |
  |            │                                        │                   |
  |            ▼                                        ▼                   |
  |  +--------------------------------------------------+                   |
  |  |                     WDK CLIENT                   |                   |
  |  |           (Wallet Development Kit SDK)           |                   |
  |  |                                                  |                   |
  |  |  - Seed Phrase Generation & Secure Key Storage   |                   |
  |  |  - Native USDt / USAt Balance & Accounts         |                   |
  |  |  - EIP-712 / Transaction Signing & Broadcasting  |                   |
  |  +-------------------------┬────────────────────────+                   |
  |                            │                                            |
  +----------------------------┼--------------------------------------------+
                               │ (P2P Intent / Signed Bet)
                               ▼
  +-------------------------------------------------------------------------+
  |                        PEARS SERVERLESS NETWORK                         |
  |                                                                         |
  |   +--------------------------+       +------------------------------+   |
  |   |        HYPERSWARM        |       |          HYPERCORE           |   |
  |   |                          |       |     (Replicated Bet Log)     |   |
  |   |  - P2P Watch-Party Chat  |◀─────▶|                              |   |
  |   |  - Peer-to-Peer Tipping  |       |  - Append-only prediction log|   |
  |   |  - Oracle Coordination   |       |  - Shared states (no central |   |
  |   +────────────┬─────────────+       |    database server)          |   |
  |                │                     +──────────────┬───────────────+   |
  |                │                                    │                   |
  +────────────────┼────────────────────────────────────┼───────────────────+
                   │ (P2P Oracle Consensus)             │ (State Changes)
                   ▼                                    ▼
  +-------------------------------------------------------------------------+
  |                          CONCENSUS ORACLE PEERS                         |
  |                                                                         |
  |  - Monitor match streams.                                               |
  |  - 2-of-3 Oracle Agreement (football-data, API-Football, openfootball). |
  |  - Write settled scores directly to the P2P Hypercore Log.              |
  +-------------------------------------------------------------------------+
```

---

## 2. Track 1: WDK Integration (Self-Custodial Wallets)

Under the current system, MoniPay manages non-custodial wallets by encrypting private keys locally with the user's PIN (AES-256-GCM) and relaying transactions through a central paymaster. In the upgraded **Tether Arena P2P**, we leverage Tether's **Wallet Development Kit (WDK)** to establish native self-custody.

### Key Implementations
1. **Direct Seed Management**: WDK handles secure wallet generation, key derivation, and storage directly on-device. Senders control their private keys and sign all payment and prediction intents locally.
2. **On-Chain USDt Settlement**: All prediction stakes and P2P tips settle in USDt on Celo, Base, BSC, or Ink. The client queries balances, retrieves account statistics, and handles gas estimation directly using WDK APIs.
3. **WDK-based MagicPay**:
   * Senders can lock USDt into the `IOURegistry` contract for Web2 recipients (e.g. `@username` on X/Twitter or Telegram) who do not yet have a wallet.
   * If a social user claims their USDt, WDK generates a clean, self-custodial account derived from their social identity credentials. The claim is submitted by the Vault relayer, and WDK imports this newly created account gaslessly, giving the user immediate, self-custodial ownership of their USDt.

### WDK Conditional Payment Code Snippet (Example)
```typescript
import { WalletClient, TokenClient } from '@tether/wdk';

// Initialize self-custodial WDK client
const wallet = new WalletClient({
  mnemonic: localStorage.getItem('wdk_mnemonic'),
  network: 'base'
});

// Approve USDt spending to the IOURegistry contract
async function approveIOURegistry(amount: number) {
  const token = new TokenClient(wallet, 'USDT_ADDRESS');
  const tx = await token.approve({
    spender: 'IOU_REGISTRY_V2_ADDRESS',
    amount: amount
  });
  console.log(`WDK Approved USDt: ${tx.hash}`);
}
```

---

## 3. Track 2: QVAC Integration (Local AI Intent Parser)

To make the user experience seamless, fans should not write raw transaction inputs. They interact with our **AI Commentary and Prediction Agent** using natural language. 

By integrating **QVAC (Local AI)**, all inference runs directly on the fan's device (desktop or mobile) with **no cloud API keys**, protecting privacy and working offline.

### Key Implementations
1. **Natural Language Processing (NLP)**: A quantized 1B-3B parameters model (e.g. Llama-3-8B-Instruct-Q4 or Gemma-2-2B-IT running via the QVAC engine) parses natural language bet statements.
   * *User Input*: "I'm sending 50 USDt to @WallstreetJade on Celo if Nigeria beats Argentina in Group L."
   * *QVAC Local Parsing*:
     ```json
     {
       "action": "CREATE_CONDITIONAL_P2P",
       "amount": 50,
       "token": "USDT",
       "chain": "celo",
       "recipient": "WallstreetJade",
       "platform": "twitter",
       "condition": {
         "team1": "Nigeria",
         "team2": "Argentina",
         "outcome": "team1_wins"
       }
     }
     ```
2. **Offline AI Football Analyst**: Fans can ask the local QVAC model for advice: `"How has Germany performed against England in past knockout stages?"`.
   * The local QVAC engine queries a compiled, offline SQLite database of team histories, head-to-heads, and tournament regulations (Retrieval-Augmented Generation / RAG).
   * It generates a probability profile and aids the fan in constructing their conditional payment parameters.

---

## 4. Track 3: Pears Integration (Serverless P2P Network)

Our current system relies on a centralized PostgreSQL database in Supabase to track `scheduled_jobs` and a Deno cron worker to sync match fixtures. In **Tether Arena P2P**, we deploy on the **Pears Stack (P2P)** to achieve a fully serverless, distributed architecture.

### Key Implementations
1. **Hyperswarm Watch Parties**: Fans join decentralized watch rooms by sharing a room key (a Hyperswarm public key). Senders and receivers establish WebRTC-like P2P connections to chat, share commentary, and send direct tips without central signaling servers.
2. **Replicated Hypercore Bet Log**: 
   * A shared **Hypercore** (an append-only log) tracks prediction entries. Senders append their signed conditional payment logs.
   * This log is replicated across all participants in the P2P room. There is no central server; the network is peer-to-peer.
3. **Decentralized 3-Source Consensus Oracle**:
   * A set of validator peers running Pear runtime run the `syncMatchResults()` oracle code.
   * When a match ends, each validator queries the three feeds (`football-data.org`, `API-Football`, `openfootball`).
   * Validators coordinate via Hyperswarm to reach consensus on the final score. Once $\ge 2$ agree, they append a signed score block to the shared Hypercore.
   * Senders' local WDK wallets listen to the Hypercore updates. When they detect a settled match block matching their active predictions, they execute the payout (calling WDK's transfer function) or cancel the authorization.

### Hypercore Bet Logging Schema (Example)
```javascript
import Hypercore from 'hypercore';
import Hyperswarm from 'hyperswarm';

const feed = new Hypercore('./tether-arena-bets', { valueEncoding: 'json' });
await feed.ready();

// Publish a prediction job to the P2P swarm
async function publishPredictionJob(jobData) {
  await feed.append(jobData);
  console.log(`[Pears] Appended bet: ${feed.length - 1}`);
}
```

---

## 5. Technical Ambition & Hackathon Win Strategy

To secure the **Cup Champion** prize (5,000 USDt), we are not simply building a generic interface. We are integrating all three tracks into a coherent, high-performance product:

| Track | Integration Point | Winning Technical Details |
|---|---|---|
| **WDK (Wallets)** | Self-Custodial Execution | Core WDK wallet integration on-device. Multi-chain support (Base, BSC, Celo, Ink). social key derivation. |
| **QVAC (Local AI)** | Offline Intent & Analyst | Zero-cloud local LLM execution. Local RAG over offline stats databases. Translates natural language to WDK transaction payloads. |
| **Pears (P2P)** | Serverless Ledger & Oracle | Replace server databases with Hypercore log replication. Hyperswarm P2P room syncing. Decentralized consensus oracle feeds. |

By delivering a fully functional, mobile-first PWA where a user can download the app, run AI commentary locally (QVAC), create a wallet (WDK), and chat/place predictions with friends in a room (Pears) completely independent of a central host, we showcase the ultimate power of the Tether stack.
