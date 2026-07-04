# Standing Up Standalone Conditional Sports P2P & MagicPay IOU Registry

Welcome to the standalone core of **MagicPay (IOURegistry)** and the **Conditional Sports P2P Engine**. This repository extracts the core Solidity contracts, database-to-chain synchronization layers, backend social identity claim verification systems, and the multi-source consensus sports oracle originally developed in our main app. It is packaged here to serve as the structural backbone for our **Tether Developers Cup** hackathon entry.

---

## Repository Structure

* **`/contracts`**: The smart contracts enabling walletless/social escrow.
  * `IOURegistry.sol`: V1 multi-chain social escrow contract.
  * `IOURegistryV2.sol`: Upgraded V2 contract with multi-token support, fee-exemption mappings, customizable hold durations, and surplus-only emergency withdrawals.
  * `interfaces/IIOURegistry.sol`: IIOURegistry interface.
* **`/oracle`**: The core intent parsing and match sync code.
  * `sportsOracle.js`: The match synchronizer that polls multiple independent data layers, enforces a 2-of-3 consensus settlement rule, and runs the evaluation logic. Also contains the regex-based sports bet intent parser.
  * `recurring.js`: Evaluates Twitter commands, runs allowance/balance pre-flights, manages cross-chain rerouting fallbacks, and inserts jobs into the database.
  * `blockchain.js`: Handles RPC failovers, Web3 connection client wrapping, contract writes, and mutex nonce-gating for high-throughput execution.
  * `database.js`: Wraps Supabase client interaction, handles database logs, and syncs off-chain states.
* **`/backend`**: Deno-based Supabase Edge Functions.
  * `claim-social-funds.ts`: Verification and claiming gateway. Checks linked socials, generates deterministic hashes, and submits on-chain batch claims.
  * `create-iou.ts`: Inserts off-chain IOU records.
  * `claim-iou.ts`: Legacy database checks on social login.
* **`/bots`**: Integration points for social channels.
  * `discord-iou.js`: Triggers on-chain deposits and handles error warnings.
  * `telegram-iou.js`: Extracts Telegram usernames, queries users, and triggers claims.

---

## 1. MagicPay (IOURegistry) Smart Contract Architecture

MagicPay allows users to send crypto assets directly to Web2 identities (e.g., `@handle` on Twitter, Discord, or Telegram) without requiring the recipient to have a pre-existing wallet or on-chain profile. 

```text
 SENDER                     IOUREGISTRY (BASE/BSC/CELO/INK)         VAULT (BACKEND)
   │                                      │                                │
   │ 1. Approve USDC/USDt                 │                                │
   ├─────────────────────────────────────▶│                                │
   │                                      │                                │
   │ 2. Request Send via MoniBot          │                                │
   ├────────────────────────────┐         │                                │
   │                            │ (Bot Executor pays gas)                  │
   │                            ▼         │                                │
   │ 3. executeCreate(from, amount, HASH) │                                │
   │    (1% fee to Treasury, 99% escrowed)│                                │
   ├─────────────────────────────────────▶│                                │
   │                                      │                                │
   │                                      │ 4. Recipient links social      │
   │                                      │    & requests claim            │
   │                                      │◀───────────────────────────────┤
   │                                      │                                │
   │                                      │ 5. batchClaim(claimant, HASH)  │
   │                                      │◀───────────────────────────────┤
   │                                      │ (Vault pays gas, checks ownership)
   │                                      │                                │
   │                                      │ 6. Release netAmount           │
   │                                      │───────────────────────────────▶│ (Claimant Wallet)
```

### Deterministic Social Identity Hashing
Recipients are represented on-chain by a `bytes32` identifier generated deterministically:
$$\text{recipientId} = \text{keccak256}(\text{platform.toLowerCase()} + \text{":"} + \text{platformUserId})$$
For example, for a Discord user with numeric ID `123456789`:
$$\text{recipientId} = \text{keccak256}(\text{"discord:123456789"})$$
* **Why Platform ID?** Using numeric user IDs (e.g., Discord's snowflake IDs or Telegram's internal numeric IDs) instead of display handles keeps the hash immutable even if the user changes their username.

### Role Separation
To guarantee absolute security and gasless operation for the user, the contracts divide permissions between three roles:
1. **Owner**: Can set fees, update supported tokens, set hold durations, and perform surplus-only emergency withdrawals.
2. **Executor** (MoniBot): Authorized to call `executeCreate` to lock funds. Pulls the token from the sender's wallet (requiring pre-flight ERC20 approval to the contract).
3. **Vault** (Backend Claim Relayer): Authorized to call `batchClaim`. It is the only entity that can unlock escrowed funds and route them to a claimant's verified address.

---

## 2. Claim Verification & Execution Engine

When an unregistered recipient wants to claim their pending funds, they sign in to the platform and link their social account. This triggers the **Claim Verification Engine**:

1. **Social Link Verification**: The user signs in via OAuth (Discord, Telegram, or X). The backend verifies the authentication token and writes the linked identity (e.g. `telegram_id` or `x_user_id`) to the user's database profile.
2. **Identity Verification Check**: The `claim-social-funds` API checks the database to verify that the calling wallet address indeed owns the linked social account.
3. **On-chain Verification**: The API computes the recipient ID hash and queries `getPendingIOUs(recipientId)` on-chain across Base, BSC, Celo, and Ink.
4. **Vault Execution**: The backend vault wallet (funded by the protocol to pay gas) calls `batchClaim(iouIds, claimantAddress, recipientId)` on the IOURegistry contract.
5. **Contract Protection**: The contract verifies that:
   $$\text{iou.recipientId} == \text{recipientId}$$
   $$\text{iou.claimed} == \text{false} \quad \&\& \quad \text{iou.refunded} == \text{false}$$
   Upon confirmation, it flips `claimed = true` and releases the tokens directly to the claimant's wallet.
6. **DB Synchronization**: The API marks the DB records as `claimed` and writes the claim transaction hash for transparency.

---

## 3. Conditional Sports P2P & Oracle Engine

The **Conditional Sports P2P** feature allows creators to distribute rewards based on sports match outcomes without locking funds in a central pool during the match.

```text
 SENDER                                 DATABASE & SCHEDULER             CONCENSUS ORACLE
   │                                              │                              │
   │ 1. Tweet: "send $10 to @user if Germany      │                              │
   │    wins England ⚽"                          │                              │
   ├─────────────────────────────────────────────▶│                              │
   │                                              │                              │
   │ 2. Parse intent & Check balance/allowance    │                              │
   │ 3. Insert job: 'conditional_sports_p2p'      │                              │
   │    status = 'pending'                        │                              │
   ├─────────────────────────────────────────────▶│                              │
   │                                              │                              │
   │                                              │ 4. Periodically fetch        │
   │                                              │    match scores              │
   │                                              │◀─────────────────────────────┤
   │                                              │ (3 independent API feeds)    │
   │                                              │                              │
   │                                              │ 5. If match finished:        │
   │                                              │    - Enforce 2-of-3 agreement│
   │                                              │    - Update match outcome    │
   │                                              │◀─────────────────────────────┤
   │                                              │                              │
   │                                              │ 6. Match past stability window:
   │                                              │    - Claim job (atomic lock) │
   │                                              │    - Evaluate bet condition  │
   │                                              │    - Fire/Cancel payment     │
   │                                              │◀─────────────────────────────┤
```

### Intent Parser
The parser uses a robust regex-based NLP pipeline:
1. Splits the tweet text at the conditional word (e.g. `if`, `sake`).
2. Extracts team names by matching input tokens against a dictionary of canonical names and aliases for all 48 World Cup teams (e.g. `usmnt`, `usa`, `la albiceleste`, `ronaldo team`).
3. Evaluates outcome verbs (`win`, `lose`, `draw`, or exact score formats like `2-1`) to derive the target outcome: `home_win`, `away_win`, `draw`, or `exact_score`.
4. Checks the sender's balance and ERC20 allowance. If insufficient, it attempts a cross-chain reroute (Base, BSC, Celo, Ink, Tempo, Solana). If it still fails, it flags a warning.

### 3-Source Consensus Sports Oracle
To prevent fraud or API failures, a consensus validator syncs scores:
* **Source 1 (Primary)**: `football-data.org` API
* **Source 2 (Fallback)**: `api-sports.io` (API-Football) API
* **Source 3 (Sanity Check)**: `openfootball` GitHub raw JSON database
* **2-of-3 Consensus Rule**: The oracle requires at least two of these independent sources to agree on the final scores and completion status. If they disagree, a **Dispute Safety Lock** is triggered, halting payouts and marking the match for manual review.
* **Match Stabilization Gate**: Evaluates predictions only after a **10-minute** delay post-match completion to ensure score changes, VAR corrections, or overrides are fully finalized in the feeds.
* **Atomic Nonce Locks**: Updates job states atomically (`UPDATE ... WHERE status = 'pending'`) and gates transactions with sequential Mutex nonces to prevent double-spending or replay attacks during transaction bursts.

---

## 4. Setup & Running Locally

### Prerequisites
* Bun or Node.js (v18+)
* Supabase CLI
* A configured `.env` file containing:
  ```env
  SUPABASE_URL=your-supabase-url
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  MONIBOT_WALLET_PRIVATE_KEY=your-executor-key
  IOU_VAULT_PRIVATE_KEY=your-vault-key
  FOOTBALL_DATA_API_KEY=your-football-data-key
  API_FOOTBALL_API_KEY=your-api-football-key
  ```

### Steps
1. Clone this repository.
2. Install dependencies:
   ```bash
   bun install
   # or
   npm install
   ```
3. Run migrations or sync the database:
   ```bash
   supabase db push
   ```
4. Start the oracle runner:
   ```bash
   bun run oracle/sportsOracle.js
   ```
