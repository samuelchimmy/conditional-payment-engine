# Build Prompt — Database & Edge Functions (Supabase)
## Tether Arena — Schema, RLS, Edge Functions, Realtime

---

## Overview
Supabase is the central truth layer for Tether Arena. It stores user profiles, conditional jobs, match results, plugin configs, and notifications. Edge functions handle all privileged operations (on-chain calls with the vault key). The agent and web app never touch the vault key directly.

---

## 1. Database Schema

### Table: `profiles`
Stores user identity across all platforms.

```sql
create table profiles (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),

  -- Social identities (at least one required)
  x_user_id       text unique,          -- Twitter numeric user ID (immutable)
  x_username      text,                 -- @handle (mutable, display only)
  discord_user_id text unique,
  discord_username text,
  telegram_user_id bigint unique,
  telegram_username text,

  -- Wallet
  wallet_address  text unique,          -- Celo address (EIP-55 checksum)
  wdk_public_key  text,                 -- WDK derived public key (optional)

  -- Identity hash for MagicPay (computed, indexed)
  -- keccak256("twitter:" || x_user_id) — set when x_user_id is linked
  recipient_id_twitter  bytea,
  recipient_id_discord  bytea,
  recipient_id_telegram bytea,

  -- Preferences
  primary_platform text default 'x',   -- 'x' | 'discord' | 'telegram'
  notification_platform text,           -- where to send bet notifications
  is_fee_exempt   boolean default false,
  is_admin        boolean default false
);

create index on profiles (x_user_id);
create index on profiles (wallet_address);
create index on profiles (recipient_id_twitter);
```

---

### Table: `scheduled_jobs`
Core table. Every conditional payment is a row here.

```sql
create table scheduled_jobs (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),

  -- Job identity
  type            text not null,         -- 'conditional_payment' | 'conditional_sports_p2p'
  external_id     text unique,           -- replay guard (keccak of message context)
  status          text not null default 'pending',
  -- Status lifecycle:
  -- pending → processing → resolved_sender | resolved_recipient → claimed | refunded
  -- pending → cancelled  (match not found, plugin error)
  -- pending → failed     (on-chain error)

  -- Timing
  started_at      timestamptz,
  completed_at    timestamptz,
  resolved_at     timestamptz,           -- when oracle resolved the condition

  -- On-chain link
  iou_id          bigint,                -- IOURegistryV3 iouId
  create_tx_hash  text,                  -- tx hash for createConditionalIOU
  resolve_tx_hash text,                  -- tx hash for resolveConditional
  claim_tx_hash   text,                  -- tx hash for claimConditional
  refund_tx_hash  text,

  -- Condition
  condition_type  text,                  -- 'football_match' | 'x_post' | 'custom_api'
  match_id        text,                  -- references sports_match_results.id
  condition_met   boolean,               -- null until resolved

  -- Payload (full context for executor)
  payload         jsonb not null,
  -- payload structure:
  -- {
  --   senderWallet, senderId, senderPayTag,
  --   amount, currency,
  --   recipient: { mode, address | twitterId, recipientId, displayTag },
  --   conditionPayload: { requiredOutcome, requiredWinner, ... },
  --   platform: 'x' | 'discord' | 'telegram',
  --   messageId,
  --   language
  -- }

  -- Error tracking
  error_message   text,
  retry_count     int default 0
);

create index on scheduled_jobs (status, match_id);
create index on scheduled_jobs (iou_id);
create index on scheduled_jobs (payload->>'senderId');
create index on scheduled_jobs (condition_type, status);
```

---

### Table: `sports_match_results`
Oracle writes here. All other systems read from here.

```sql
create table sports_match_results (
  id              text primary key,      -- API match ID or 'teamA_vs_teamB'
  created_at      timestamptz default now(),

  home_team       text not null,
  away_team       text not null,
  home_score      int,
  away_score      int,

  status          text default 'notstarted',
  -- 'notstarted' | 'live' | 'finished' | 'disputed' | 'postponed'

  finished        boolean default false,
  outcome         text,
  -- 'home_win' | 'away_win' | 'draw' | null

  winner_team     text,
  match_datetime  timestamptz,
  venue           text,
  group_name      text,
  round           text,

  -- Oracle metadata
  last_synced_at  timestamptz,
  completed_at    timestamptz,           -- when first marked finished
  stability_at    timestamptz,           -- completed_at + 10 min stability window
  disputed        boolean default false,
  dispute_notes   text,

  api_raw         jsonb                  -- raw payload from primary source
);

create index on sports_match_results (status, finished, stability_at);
create index on sports_match_results (home_team, away_team);
```

---

### Table: `condition_plugins`
Admin-configurable plugin registry. Agent hot-reloads on changes.

```sql
create table condition_plugins (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),

  name            text unique not null,  -- e.g. 'custom_price_check'
  display_name    text,
  plugin_type     text not null,
  -- 'built_in' (football_match, x_post) or 'custom_api'

  enabled         boolean default true,
  version         text,
  description     text,

  -- For custom_api plugins only
  config          jsonb,
  -- {
  --   endpoint: string,
  --   method: 'GET' | 'POST',
  --   headers: { [key]: value },
  --   jsonPath: string,           -- e.g. "$.data.winner"
  --   expectedValue: string,
  --   pollIntervalMinutes: number,
  --   authType: 'none' | 'bearer' | 'basic',
  --   authSecret: string          -- store in Supabase Vault, not plain text
  -- }

  last_evaluated_at timestamptz,
  last_error        text
);

-- Seed built-in plugins (never deleted by admin)
insert into condition_plugins (name, display_name, plugin_type, enabled, version, description) values
  ('football_match', 'Football Match Outcome', 'built_in', true, '2.0.0', 'WC2026 match outcome: team wins, loses, or draws'),
  ('x_post_engagement', 'X/Twitter Post Engagement', 'built_in', true, '1.0.0', 'Twitter post metric condition: likes, retweets, views');
```

---

### Table: `iou_registry_mirror`
Off-chain mirror of on-chain IOU state. Synced by the vault after every tx.

```sql
create table iou_registry_mirror (
  iou_id          bigint primary key,
  created_at      timestamptz default now(),

  sender_address  text not null,
  token_address   text not null,
  net_amount      numeric(18, 6) not null,
  recipient_id    text not null,         -- hex bytes32
  expiry          timestamptz,

  claimed         boolean default false,
  refunded        boolean default false,

  -- V3 conditional fields
  is_conditional  boolean default false,
  condition_hash  text,                  -- hex bytes32
  job_id          uuid references scheduled_jobs(id),
  resolved_at     timestamptz,
  resolved_in_favor smallint default 0,
  -- 0 = unresolved, 1 = sender, 2 = recipient

  chain           text default 'celo',
  create_tx_hash  text,
  resolve_tx_hash text,
  claim_tx_hash   text
);

create index on iou_registry_mirror (recipient_id);
create index on iou_registry_mirror (sender_address);
create index on iou_registry_mirror (job_id);
```

---

### Table: `notifications`
Queue for platform notifications (bet created, bet resolved, claim available).

```sql
create table notifications (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  sent_at         timestamptz,

  recipient_user_id uuid references profiles(id),
  platform        text not null,         -- 'x' | 'discord' | 'telegram'
  platform_user_id text not null,        -- the platform-specific ID to message

  type            text not null,
  -- 'bet_created' | 'condition_met' | 'condition_not_met' | 'claim_available'
  -- 'claim_processed' | 'refund_available' | 'refund_processed' | 'dispute'

  message         text not null,         -- pre-formatted platform message
  metadata        jsonb,                 -- extra context (iouId, amount, match, etc.)

  status          text default 'pending' -- 'pending' | 'sent' | 'failed'
);

create index on notifications (status, platform);
create index on notifications (recipient_user_id);
```

---

### Table: `transactions_log`
Append-only audit log of every on-chain action taken.

```sql
create table transactions_log (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),

  sender_id       uuid references profiles(id),
  receiver_id     uuid references profiles(id),
  amount          numeric(18, 6),
  fee             numeric(18, 6),
  tx_hash         text,
  type            text,
  chain           text,
  iou_id          bigint,
  job_id          uuid,
  error_reason    text,
  language        text
);
```

---

## 2. Row Level Security (RLS)

```sql
-- Enable RLS on all tables
alter table profiles enable row level security;
alter table scheduled_jobs enable row level security;
alter table iou_registry_mirror enable row level security;
alter table notifications enable row level security;

-- profiles: users can only read/update their own row
create policy "own profile" on profiles
  for all using (auth.uid() = id);

-- scheduled_jobs: users can read their own jobs
create policy "read own jobs" on scheduled_jobs
  for select using (payload->>'senderId' = auth.uid()::text);

-- scheduled_jobs: only service role can insert/update
-- (agent uses service key, never anon key for writes)

-- iou_registry_mirror: anyone can read (public blockchain data)
create policy "public read" on iou_registry_mirror
  for select using (true);

-- notifications: users can read their own
create policy "own notifications" on notifications
  for select using (recipient_user_id = auth.uid());

-- condition_plugins: admin only for write, anyone can read
create policy "public read plugins" on condition_plugins
  for select using (true);
create policy "admin write plugins" on condition_plugins
  for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );
```

---

## 3. Edge Functions

All edge functions use the service role key and are the only place vault private keys are used.

### `create-conditional-iou`
**Triggered by**: Web app `/api/create-conditional` or agent backend

**What it does**:
1. Validate OAuth session (must be authenticated user)
2. Validate intent payload (amount, recipient, condition)
3. Check sender profile exists + has wallet address
4. Rate limit check: max 10 conditional payments per 24h (per sender_id)
5. Check balance via Celo RPC read (no signing needed)
6. Generate `external_id` for deduplication
7. Insert row into `scheduled_jobs` with `status = 'pending'`
8. Call IOURegistryV3 `createConditionalIOU` with executor wallet (CIP-64 tx)
9. Insert into `iou_registry_mirror`
10. Update `scheduled_jobs` with `iou_id` and `create_tx_hash`
11. Queue `bet_created` notifications for sender (and recipient if they have a profile)
12. Return `{ jobId, iouId, txHash, preview }`

**Error cases**:
- `INSUFFICIENT_BALANCE` → return human-readable error, do not insert job
- `DUPLICATE_BET` → return existing job ID (idempotent)
- `MATCH_NOT_FOUND` → return error, do not insert
- `MATCH_ALREADY_FINISHED` → return error with final score

---

### `resolve-conditional`
**Triggered by**: Oracle worker (internal, service role only)

**What it does**:
1. Receive `{ jobId, conditionMet }`
2. Load job from `scheduled_jobs` — must be `status = 'processing'`
3. Determine winner: `conditionMet ? 2 : 1`
4. Call `resolveConditional(iouId, winner)` on IOURegistryV3 (vault key, CIP-64)
5. Update `scheduled_jobs`: `status = resolved_sender | resolved_recipient`, `resolved_at`, `condition_met`
6. Update `iou_registry_mirror`: `resolved_at`, `resolved_in_favor`
7. If `conditionMet` and recipient has registered wallet → call `claim-social-funds`
8. Queue notifications for both parties

---

### `claim-social-funds`
**Triggered by**: Web app claim flow (authenticated user) or `resolve-conditional` (auto-claim)

**What it does**:
1. Verify caller's OAuth token matches the `recipientId` in the IOU
2. Load IOU from `iou_registry_mirror` — must be `resolved_in_favor = 2`
3. Get claimant wallet address (from profile or WDK-generated during claim flow)
4. Call `claimConditional(iouId, claimantAddress, recipientId)` on contract (vault key, CIP-64)
5. Update `scheduled_jobs`: `status = 'claimed'`, `claim_tx_hash`
6. Update `iou_registry_mirror`: `claimed = true`, `claim_tx_hash`
7. Queue `claim_processed` notification for recipient
8. Return `{ txHash, amount }`

---

### `refund-conditional`
**Triggered by**: Web app refund request (authenticated sender) or executor after 7-day expiry

**What it does**:
1. Authenticate sender (must match `iou.sender_address`)
2. Load IOU from mirror
3. **Eligibility check** (mirrors the on-chain check — fail fast before burning gas):
   - If `resolved_in_favor = 1` (sender won) → eligible immediately ✅
   - If `resolved_in_favor = 2` (recipient won) and `Date.now() >= resolvedAt + 7 days` → eligible ✅
   - If `resolved_in_favor = 2` and still within 7 days → return `{ eligible: false, unlocksAt: resolvedAt + 7_days }`
   - If `resolved_in_favor = 0` and `expiry < now` → eligible (match postponed / never settled)
4. Call `refundConditional(iouId)` on contract (executor signs, CIP-64)
5. Update mirror + job status
6. Return `{ txHash, amount, refundedAt }`

---

### `notify-parties` (cron, every 2 minutes)
**Triggered by**: Supabase pg_cron or the agent worker loop

**What it does**:
1. Fetch `notifications` where `status = 'pending'`, `created_at < now - 30s` (give agent time to send inline), limit 50
2. For each notification: look up `platform` and call the appropriate platform API
3. Update `status = 'sent'` or `status = 'failed'`
4. Failed notifications: increment retry_count, retry up to 3 times

---

## 4. Realtime Subscriptions

The agent and web app subscribe to these Supabase realtime channels:

```javascript
// Agent: watch for new pending jobs (fallback if cron is late)
supabase.channel('jobs')
  .on('postgres_changes', {
    event: 'INSERT', schema: 'public', table: 'scheduled_jobs',
    filter: 'status=eq.pending'
  }, handleNewJob)
  .subscribe();

// Agent: hot-reload plugin registry when admin edits condition_plugins
supabase.channel('plugins')
  .on('postgres_changes', {
    event: '*', schema: 'public', table: 'condition_plugins'
  }, reloadPlugins)
  .subscribe();

// Web app: live bet feed on home page
supabase.channel('public-bets')
  .on('postgres_changes', {
    event: 'UPDATE', schema: 'public', table: 'scheduled_jobs'
  }, updateBetCard)
  .subscribe();

// Web app: user's personal dashboard
supabase.channel(`user-${userId}`)
  .on('postgres_changes', {
    event: '*', schema: 'public', table: 'scheduled_jobs',
    filter: `payload->>senderId=eq.${userId}`
  }, refreshDashboard)
  .subscribe();
```

---

## 5. Supabase Vault (Secrets)
Store these in Supabase Vault, not as plain env vars in edge functions:
- `VAULT_PRIVATE_KEY` — the on-chain vault signing key
- `EXECUTOR_PRIVATE_KEY` — the bot executor key
- `GEMINI_API_KEY`
- `TWITTER_API_SECRET`
- `X_POST_PLUGIN_BEARER_TOKEN` — read-only X token for the x_post plugin

Access in edge functions:
```typescript
const { data } = await supabase.rpc('vault.decrypted_secrets', { secret_name: 'VAULT_PRIVATE_KEY' });
```

---

## 6. Blind Spots & Edge Cases to Handle

### Match Postponement
If a match is postponed after a bet is placed (e.g. Nigeria vs Brazil postponed due to venue issue), the job stays `pending` indefinitely. The contract's standard `expiry` (hold duration) serves as the safety valve: after `expiry` passes with `resolved_in_favor = 0`, `refundConditional` becomes available to the sender. The oracle should update `sports_match_results.status = 'postponed'` and the evaluator should auto-cancel pending jobs linked to postponed matches, triggering immediate refund.

### Disputed Scores
If oracle sources disagree on a score, the match stays `disputed`. No jobs for this match are evaluated. An admin notification is sent (Supabase dashboard alert + Discord webhook to a private admin channel). Admin can either: (a) manually mark the correct score and re-run evaluation, or (b) cancel all jobs for that match with immediate sender refund.

### Recipient Claims After 7-Day Window Is Open
If the recipient claims after the 7-day window has opened (but before the sender refunds), the claim still succeeds because `claimConditional` has no time restriction. The 7-day window gives the sender a safety valve but does not remove the recipient's right to claim. The contract checks `resolvedInFavor == 2` for claim eligibility, independently of time.

### Multiple Bets on Same Match
A sender can place multiple conditional payments on the same match (e.g. different recipients). Each is a separate IOU with a separate job. The oracle resolves them all in one batch evaluation cycle. This is correct behavior.

### User Deletes X Account After Bet Is Placed
The `recipientId` is computed from the numeric Twitter user ID, which is immutable even if the @handle changes. If the account is deleted, the ID is gone and the recipient hash can never be re-verified. After the match resolves and 7 days pass, the sender can refund. This is documented behavior.

### Bot Impersonation
If someone creates a fake @TetherArena account and replies to bets, the platform adapters must verify that responses come from the official account ID only. Store the official account ID as an env var and reject any message from a different ID claiming to be the bot.

### Gas (USDT) Depletion on Executor
The executor wallet needs a USDT balance for CIP-64 gas. On Celo, gas per tx is ~0.001–0.003 USDT. Monitor the executor USDT balance and alert (Supabase cron) when it drops below a configured threshold (e.g. 5 USDT). The hackathon demo executor should start with at least 50 USDT for gas.

### Supabase Free Tier Limits (hackathon)
- Row limit: not a concern for hackathon scale
- Realtime connections: free tier allows 200 concurrent. The agent uses 2-3 channels. Fine.
- Edge function invocations: 500k/month free. Well within budget.
- Database compute: free tier pauses after inactivity. Set `keep-alive` ping from the agent process every 5 minutes.

---

## 7. Migration / Deployment Order

```
1. Create Supabase project
2. Run schema migrations (in order):
   a. profiles
   b. sports_match_results
   c. condition_plugins + seed built-in plugins
   d. scheduled_jobs
   e. iou_registry_mirror
   f. notifications
   g. transactions_log
3. Enable RLS policies
4. Set up Supabase Vault secrets
5. Deploy edge functions:
   a. create-conditional-iou
   b. resolve-conditional
   c. claim-social-funds
   d. refund-conditional
   e. notify-parties
6. Enable realtime for: scheduled_jobs, condition_plugins
7. Deploy IOURegistryV3 on Celo Alfajores (testnet first)
8. Update IOU_REGISTRY_V3 env var in Supabase Vault
9. Start agent backend
10. Start Next.js web app
11. Smoke test: place a bet via X bot, simulate resolution, claim via web app
```
