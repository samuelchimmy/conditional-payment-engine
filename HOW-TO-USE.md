# How to Use Tether Arena ⚽

> **Conditional USDT payments for football fans.**
> Say it in plain language. Funds lock automatically. Winner gets paid when the match ends.

---

## Getting Started

You don't download anything. Tether Arena lives inside **X (Twitter)**, **Discord**, and **Telegram**. The web app at [arena.tether.io](https://arena.tether.io) is where you manage your wallet, check your bets, and claim winnings.

---

## Step 1 — Create Your Wallet (Recommended)

When you first interact with the app or bot, you'll be guided to **arena.tether.io/connect**. This is where your wallet is created.

### ✅ Recommended: Create a New Wallet

Tap **"Create Wallet"** — this is the primary, recommended entry method.

**What happens:**

**a) Set a 6-digit PIN**
Your PIN encrypts your private key locally using AES-256-GCM. Tether Arena never sees your PIN or your private key. There is no PIN reset — if you forget it, you restore from backup. Choose a PIN you'll remember.

**b) Back up to Google Drive** *(strongly recommended, happens automatically)*
Immediately after PIN creation, you are prompted to connect your Google account. The app uploads an AES-GCM encrypted blob of your wallet to your private Google Drive `appDataFolder` — a hidden folder only your app can see, invisible to you in Drive's UI.

- The backup is encrypted with your PIN before upload. Google cannot decrypt it.
- You can sign in on any new device, tap **"Restore from Google Drive"**, enter your PIN, and your wallet is back instantly.
- This is why Google sign-in on a new device "just works" — it finds the encrypted backup and decrypts it with your PIN.

**c) Save your recovery phrase** *(fallback)*
After Google Drive backup, you're shown a 12-word recovery phrase. Write it down and store it offline. This is your ultimate fallback if you forget your PIN and lose access to your Google account.

```
Backup priority:
1. Google Drive (encrypted, recommended — seamless restore)
2. 12-word recovery phrase (manual, offline fallback)
3. Neither → a forgotten PIN = permanent wallet loss (self-custody)
```

### Or: Connect an Existing Wallet
If you already have a Celo wallet (MetaMask, Rabby, or any EVM wallet), you can connect it instead. You'll skip the wallet creation steps above.

---

## Step 2 — Deposit USDT

After your wallet is created, tap **"Fund Wallet"**. You have two options:

### Option A — Direct Deposit
Copy your Celo wallet address (or scan the QR code) and send USDT directly from any exchange or wallet that supports the Celo network.

| Token | Network to select |
|---|---|
| USDT | Celo (not Ethereum, not BNB) |

Deposits appear in your dashboard within 30 seconds of on-chain confirmation.

### Option B — Cross-Chain Bridge
Already have USDT or USDC on another chain? Tap **"Bridge from another chain"**. The built-in bridge (powered by LI.FI) lets you move funds from:

| From Chain | Token |
|---|---|
| Ethereum | USDT, USDC |
| Base | USDC |
| BNB Smart Chain | USDT |
| Arbitrum | USDT, USDC |
| Polygon | USDT, USDC |

Select your source chain and token, enter the amount, confirm. The bridge handles the cross-chain transfer and delivers USDT to your Celo wallet. No manual address copying or network switching needed — it's done in one flow.

> Bridge fees are set by LI.FI routing and are shown before you confirm. For amounts above $20, bridge fees are typically under 0.5%.

---

## Step 3 — Place a Conditional Bet

Now the fun part. Go to X, Discord, or Telegram and talk to the bot naturally.

### On X (Twitter)
```
@TetherArena send 15 USDT to @jade if Nigeria beats Brazil
```

### On Discord
```
/bet send 20 USDT to @sam if Morocco draws France
```

### On Telegram
```
/bet Send 10 USDT to @carlos if Argentina wins Spain
```

**The bot understands you.** It uses Gemini AI to parse intent, so you don't need to use specific commands or exact wording. All of these work:

```
"abeg send 8 USDT give @bola if super eagles chop argentina 2-1"
"si nigeria empata brasil manda 12 USDT a @raul"
"send jade 25 dollars if the three lions beat germany tonight"
"if brazil loses to nigeria, @sam gets 30 USDT"
```

**Within 10 seconds**, the bot replies:
```
🔒 Locked! I'll send @jade 15 USDT if Nigeria beats Brazil.
Match: July 9 at 20:00 UTC · Group L
Your 15 USDT is safe in escrow until then.
Job ID: #AB12
```

Your USDT is now locked in the smart contract. Neither you nor Tether Arena can spend it — only the match result determines what happens next.

---

## Step 4 — Wait for the Match

Nothing to do. The oracle checks 3 independent football data sources every 3 minutes:
- `football-data.org`
- `API-Football`
- `openfootball`

It requires **2 out of 3 sources to agree on the same score** before marking a match settled. After agreement, it waits a **10-minute stability window** before evaluating your bet. This prevents acting on a corrupted or mid-game score.

---

## Step 5A — If Your Condition Was Met (Recipient Wins)

Example: you bet Nigeria wins, Nigeria wins 2–0.

**What happens automatically:**
- The oracle writes the outcome permanently on-chain
- If @jade has a registered wallet → USDT transfers to her wallet automatically
- If @jade has no wallet → funds stay safely in escrow (she claims via the web app)

**You receive a notification:**
```
🏟️ Nigeria 2-0 Brazil
❌ Your condition was met.
💸 15 USDT was sent to @jade.
```

**@jade receives:**
```
🎉 You won! @fan bet 15 USDT that Nigeria would beat Brazil.
Nigeria won 2-0. Tap to claim your 15 USDT:
👉 arena.tether.io/claim
```

---

## Step 5B — If Your Condition Was NOT Met (Sender Wins)

Example: you bet Nigeria wins, Nigeria loses 0–2.

**You receive a notification:**
```
🏟️ Nigeria 0-2 Brazil
✅ Your condition wasn't met — Nigeria didn't win.
💰 Your 15 USDT is ready to refund.
👉 arena.tether.io/dashboard
```

**You tap "Refund" on your dashboard.** The refund is not automatic — you initiate it yourself. This is intentional: auto-refunds burn gas costs silently on your behalf. By making refunds one-tap from the dashboard, you stay in control of when the transaction happens, and the gas cost (paid in USDT via Celo's fee system) is transparent before you confirm.

Your 15 USDT returns to your wallet within seconds of tapping Refund.

---

## Step 6 — Claiming (For Recipients with No Wallet)

If someone bet USDT to you and you have no crypto wallet, you'll receive a message like:

```
🎉 @fan bet 15 USDT that Nigeria would beat Brazil.
Nigeria won! The 15 USDT is yours. Claim it here:
👉 arena.tether.io/claim
```

**The claim flow:**

1. **"You have 15 USDT waiting"** — shows the amount, who sent it, and why you won.

2. **"Verify it's you"** — tap "Sign in with X" (or Discord/Telegram). Standard OAuth login. Takes 10 seconds.

3. **"Create your wallet"** — you're walked through the same wallet creation as Step 1 above:
   - Set a PIN
   - Back up to Google Drive (recommended — future sign-ins will restore your wallet automatically)
   - Save your recovery phrase

   Or connect an existing Celo wallet.

4. **"Claiming..."** — the system verifies your social identity matches the locked funds, then transfers.

5. **"Claimed! 🎉"** — 15 USDT is in your wallet. This may be the first crypto you've ever owned. You never saw a gas prompt, a contract address, or the word "blockchain."

---

## Refund Rules (When Can You Get Your Money Back?)

| What Happened | When Can Sender Refund? |
|---|---|
| **Your condition was NOT met** (you won the bet) | Immediately — tap Refund on your dashboard |
| **Your condition WAS met** (recipient won) | After 7 days from when the match resolved. This gives the recipient time to claim before you can reclaim. |
| **Match was postponed / never resolved** | After the IOU's expiry date (set when you placed the bet, typically match date + several days buffer) |

**The 7-day rule explained:** If Nigeria wins and @jade should receive 15 USDT, the 7 days protect @jade. She might be in a different timezone, might not have seen the notification, or might need to create a wallet. After 7 days of unclaimed funds, you can take them back — but @jade can still claim at any point before you do.

---

## Managing Your Bets

Visit **arena.tether.io/dashboard** to see all your bets:

- **Active** — match hasn't happened yet, USDT locked in escrow
- **Won 🏆** — your condition was met, funds sent to recipient
- **Lost 💔** — your condition wasn't met, refund available
- **Refunded** — funds returned to your wallet
- **Disputed ⚠️** — oracle sources disagreed on the score, under admin review

---

## Adding New Condition Types (Admins)

Tether Arena's condition engine is plugin-based. Admins can add new condition types from the Supabase dashboard — no code deployment needed.

1. Go to Supabase Admin → `condition_plugins` table
2. Insert a row with `plugin_type = 'custom_api'`
3. Fill in the `config` JSON:
```json
{
  "endpoint": "https://api.example.com/result",
  "jsonPath": "$.data.winner",
  "expectedValue": "nigeria",
  "pollIntervalMinutes": 10
}
```
4. The agent hot-reloads within seconds. The new condition type is live.

**Built-in condition types:**
- `football_match` — WC2026 match outcomes (win / draw / exact score)
- `x_post_engagement` — Twitter post metrics (likes, retweets, views threshold)
- `custom_api` — Any JSON API endpoint, admin-configured

---

## Supported Commands

| Platform | Command | Example |
|---|---|---|
| X (Twitter) | Mention @TetherArena naturally | `@TetherArena send 10 USDT to @sam if nigeria wins` |
| Discord | `/bet [text]` | `/bet 15 USDT to @jade if brazil draws france` |
| Discord | `/mybets` | View your active bets |
| Discord | `/balance` | Check your USDT balance |
| Discord | `/claim` | Start the claim flow |
| Telegram | `/bet [text]` | `/bet Send 20 USDT to @carlos if argentina wins` |
| Telegram | `/mybets` | View your active bets |
| Telegram | `/claim` | Start the claim flow |
| Telegram | `/start` | Onboarding message + wallet creation link |

---

## Invisible Web3 Promise

At no point in any of the above flows will you:
- Pay gas manually (Celo CIP-64 lets gas be paid in USDT by the system)
- See a wallet address (you see @handles)
- Be asked to switch networks (the app is Celo-only, silently)
- See "blockchain", "smart contract", or "gas" in normal usage
- Need to buy CELO to use the app

The only Web3 moment is the 12-word recovery phrase during wallet creation — and even that is skippable if you use Google Drive backup.

---

## FAQ

**Q: What if @jade has no wallet when Nigeria wins?**
Her 15 USDT stays safely locked in the smart contract. She has 7 days to create a wallet and claim. After 7 days, you can reclaim it — but she can still claim before you do.

**Q: What if the match is postponed?**
The bot notifies both parties. The USDT stays in escrow. After the IOU's expiry date (set when the bet was placed), you can refund regardless of the outcome.

**Q: What if the oracle sources disagree on the score?**
The bet is marked "Disputed" and no funds move. An admin reviews and either confirms the correct score or cancels the bet with an immediate sender refund.

**Q: Is there a minimum or maximum bet?**
Minimum: 1 USDT. Maximum: 500 USDT per single conditional bet (configurable by admin).

**Q: What's the fee?**
1% of the bet amount, taken at creation time and sent to the treasury. The recipient receives the full net amount.

**Q: What happens to my wallet if I clear my browser?**
If you backed up to Google Drive: sign in with Google → enter your PIN → wallet restored instantly.
If you only have the recovery phrase: import it on the /connect page.
If neither: the wallet is unrecoverable. This is self-custody.

**Q: Can I use Tether Arena without connecting to X/Discord/Telegram?**
Yes — you can use the web app at arena.tether.io directly to place bets, check status, and manage your wallet. The social bots are just convenient entry points.
