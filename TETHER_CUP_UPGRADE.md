# Tether Developers Cup Hackathon Proposal: "Tether Arena P2P"
## Architectural Upgrade Blueprint (WDK + Pears P2P Stack)

This document details the technical upgrade design for **Tether Arena P2P**. We are moving away from our legacy centralized architecture (which relied on central servers, databases, and cron workers) to a fully decentralized model built on the **Pears P2P Stack** and **Tether's Wallet Development Kit (WDK)**.

---

## 1. System Architecture

```text
  +-----------------------------------------------------------------------------+
  |                           FAN DEVICE (PWA / Desktop client)                 |
  |                                                                             |
  |  +---------------------------+             +-----------------------------+  |
  |  |      USER INTERFACE       |             |         WDK CLIENT          |  |
  |  |                           |             | (Wallet Development Kit)    |  |
  |  |  - P2P Watch-Party Chat   |             |                             |  |
  |  |  - Active Predictions Feed│◀───────────▶│ - Seed & Key Storage        |  |
  |  |  - USDt Balance & Taps    |             | - Local Tx signing (USDt)   |  |
  |  +─────────────┬─────────────+             +──────────────┬──────────────+  |
  |                │                                          │                 |
  +────────────────┼──────────────────────────────────────────┼─────────────────+
                   │ (Direct P2P Replicated Swarm)            │ (Broadcasts)
                   ▼                                          ▼
  +-----------------------------------------------------------------------------+
  |                          PEARS SERVERLESS NETWORK                           |
  |                                                                             |
  |   +--------------------------+       +----------------------------------+   |
  |   |        HYPERSWARM        |       |            HYPERCORE             |   |
  |   |                          |       |        (Distributed Log)         |   |
  |   |  - Serverless connection |◀─────▶|                                  |   |
  |   |    between fans          |       | - Replicated append-only log of  |   |
  |   |  - P2P chat transmission |       |   predictions and agreements     |   |
  |   +────────────┬─────────────+       +────────────────┬─────────────────+   |
  |                │                                      │                     |
  +────────────────┼──────────────────────────────────────┼─────────────────────+
                   │ (P2P Consensus)                      │ (Settle blocks)
                   ▼                                      ▼
  +-----------------------------------------------------------------------------+
  |                        PEARS CONSENSUS ORACLE PEERS                         |
  |                                                                             |
  |  - Listen to match end events.                                              |
  |  - 2-of-3 score consensus (football-data.org, API-Football, openfootball).  |
  |  - Write settled scores directly to the replicated Hypercore log.           |
  +-----------------------------------------------------------------------------+
```

---

## 2. Pears (P2P Stack) Explained: What It Replaces

In our legacy app, all core operations are brokered by central servers. In **Tether Arena P2P**, we leverage the Pears Stack building blocks (**Hyperswarm**, **Hypercore**, and **Autobase**) to eliminate centralized points of failure.

Here is a breakdown of what the Pears Stack is replacing:

### A. Replacing the Central Database (Supabase PostgreSQL)
* **Legacy System**: Senders, receivers, and transactions are stored in a centralized Supabase relational database. The prediction jobs (`scheduled_jobs` table) live in PostgreSQL.
* **Pears Replacement (Hypercore)**: We use **Hypercore**, a secure, distributed, append-only log. 
  * When a user creates a sports prediction (e.g. *"I stake 10 USDt that Nigeria beats Germany"*), this record is appended to a local Hypercore.
  * Hypercore cryptographically signs every block. The log is replicated directly between the sender and receiver devices peer-to-peer. There is no databases server.

### B. Replacing Centralized Relayers & Worker Daemons (Cron Jobs)
* **Legacy System**: A centralized Node.js worker daemon (`worker-bot`) runs constantly in the background. It uses a scheduler to query Supabase tables, check if matches are finished, evaluate conditions, and trigger blockchain calls.
* **Pears Replacement (Autobase & Event Listeners)**: We use **Autobase** to merge the Hypercores of the sender, recipient, and oracle consensus nodes into a single, linearized view of the prediction state.
  * The user's local WDK client runs a peer-to-peer event listener on the Autobase stream.
  * When the local client detects that a verified match settlement block has been written to the log, it evaluates the prediction locally and prompts execution. No centralized relayer is needed.

### C. Replacing Centralized Web2 Message APIs
* **Legacy System**: Fans interact by posting tweets on Twitter or messaging on Discord/Telegram, which the bots poll via central Web2 APIs.
* **Pears Replacement (Hyperswarm)**: We use **Hyperswarm** to establish direct peer-to-peer connections.
  * Fans create P2P watch rooms. A room is represented by a 32-byte public key.
  * Peers find each other via DHT (Distributed Hash Table) and open direct streams. All chat messages, prediction intents, and tipping requests are swarmed directly between devices.

### D. Replacing Centralized Oracle Feeds
* **Legacy System**: A centralized relayer server queries sports APIs and writes the result to a central DB.
* **Pears Replacement (Swarmed P2P Oracles)**:
  * A collection of volunteer/consensus nodes run on the Pears runtime.
  * When a match ends, these nodes fetch the score, share it with each other over Hyperswarm, check for a 2-of-3 agreement, and collectively sign a match result block.
  * This signed block is broadcasted directly to the swarm, updating the shared Hypercore.

---

## 3. WDK Integration (Self-Custodial Wallets)

To make Tether Arena P2P a true Web3 product, we integrate **Tether's Wallet Development Kit (WDK)**. WDK handles the wallet lifecycle locally on the client.

### Core Functions
1. **Self-Custodial Balance Management**: WDK generates seed phrases on-device and manages accounts. Senders' private keys never leave their browser/device.
2. **On-Chain USDt Settlement**: Stakes are stored in the `IOURegistryV2` contract in USDt. WDK clients sign authorization messages (EIP-712 typed signatures) locally to approve transaction locking.
3. **Decentralized MagicPay Claims**:
   * If a sender locks USDt for a social user who doesn't have a wallet, WDK creates an escrow in the `IOURegistry` contract.
   * When the recipient claims it, WDK handles the generation of their self-custodial wallet derived from their social logins. The backend vault wallet calls `batchClaim` on-chain, releasing the USDt to the user's new self-custodial wallet.

---

## 4. Technical Ambition & Hackathon Win Strategy

| Centralized Legacy Component | Pears P2P Replacement | Technical Benefit |
|---|---|---|
| **Supabase DB** | Hypercore Replicated Log | Tamper-proof, serverless event log stored locally and shared peer-to-peer. |
| **Worker Cron Server** | Autobase & Local Client Listeners | Decentralized execution. Senders' clients listen to P2P logs and trigger local actions. |
| **Centralized Chat Server** | Hyperswarm DHT | Serverless watch rooms, direct peer communication, and zero network logging. |
| **Centralized Oracle Server** | Swarmed P2P Consensus Nodes | Protects predictions against single-point-of-failure API issues. |
