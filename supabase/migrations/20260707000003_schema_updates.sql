-- ═══════════════════════════════════════════════════════════════════
-- Migration: Schema updates to support all current edge functions
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS guards)
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. siwe_nonces table (required by auth-session edge function) ────────────
-- Used to store SIWE nonces for wallet authentication.
-- Without this table, the auth-session function will throw a 500 error.
CREATE TABLE IF NOT EXISTS public.siwe_nonces (
  wallet_address TEXT PRIMARY KEY,
  nonce          TEXT NOT NULL,
  expires_at     TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Lock down siwe_nonces — only service_role (Edge Functions) can touch it
ALTER TABLE public.siwe_nonces ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.siwe_nonces FROM anon;
REVOKE ALL ON public.siwe_nonces FROM authenticated;
GRANT ALL ON public.siwe_nonces TO service_role;

-- ─── 2. wallet_profiles — add missing columns ─────────────────────────────────
-- telegram_username: stored when user links Telegram (used in db-proxy get-bets)
ALTER TABLE public.wallet_profiles
  ADD COLUMN IF NOT EXISTS telegram_username TEXT;

-- discord_username: stored when user links Discord (used for display in settings)
ALTER TABLE public.wallet_profiles
  ADD COLUMN IF NOT EXISTS discord_username TEXT;

-- google_email: stored when user links Google (used by social-identity link-google)
ALTER TABLE public.wallet_profiles
  ADD COLUMN IF NOT EXISTS google_email TEXT;

-- google_picture: avatar URL from Google OAuth
ALTER TABLE public.wallet_profiles
  ADD COLUMN IF NOT EXISTS google_picture TEXT;

-- Notification preferences (used by db-proxy update-preferences action)
ALTER TABLE public.wallet_profiles
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;

ALTER TABLE public.wallet_profiles
  ADD COLUMN IF NOT EXISTS payment_alerts_enabled BOOLEAN DEFAULT true;

ALTER TABLE public.wallet_profiles
  ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN DEFAULT true;

ALTER TABLE public.wallet_profiles
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- ─── 3. conditional_payments — add missing columns ────────────────────────────
-- resolved_at: timestamp when the oracle resolved the match
ALTER TABLE public.conditional_payments
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- claimed_at: timestamp when the winner claimed their funds
ALTER TABLE public.conditional_payments
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- recipient_wallet: populated by secure-claim when recipient links their wallet
ALTER TABLE public.conditional_payments
  ADD COLUMN IF NOT EXISTS recipient_wallet TEXT;

-- ─── 4. agent_transactions — add missing columns ──────────────────────────────
-- condition_str: plain language condition parsed from the social message
ALTER TABLE public.agent_transactions
  ADD COLUMN IF NOT EXISTS condition_str TEXT;

-- parsed_at: when the AI parsed the intent
ALTER TABLE public.agent_transactions
  ADD COLUMN IF NOT EXISTS parsed_at TIMESTAMPTZ;

-- iou_id: the on-chain IOU ID once it's been created
ALTER TABLE public.agent_transactions
  ADD COLUMN IF NOT EXISTS iou_id TEXT;

-- ─── 5. sports_match_results — add missing columns ───────────────────────────
-- match_date: when the match is/was scheduled
ALTER TABLE public.sports_match_results
  ADD COLUMN IF NOT EXISTS match_date TIMESTAMPTZ;

-- tournament: e.g. "World Cup 2026"
ALTER TABLE public.sports_match_results
  ADD COLUMN IF NOT EXISTS tournament TEXT;

-- external_id: ID from the sports data API for deduplication
ALTER TABLE public.sports_match_results
  ADD COLUMN IF NOT EXISTS external_id TEXT;

-- winner: 'home' | 'away' | 'draw'
ALTER TABLE public.sports_match_results
  ADD COLUMN IF NOT EXISTS winner TEXT;

-- ─── 6. Ensure service_role grants are applied to sports_match_results ────────
ALTER TABLE public.sports_match_results ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sports_match_results FROM anon;
REVOKE ALL ON public.sports_match_results FROM authenticated;
GRANT ALL ON public.sports_match_results TO service_role;

-- ─── 7. Ensure service_role has access to sequences (for SERIAL PKs) ─────────
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ─── Done ─────────────────────────────────────────────────────────────────────
-- After running this, deploy all missing edge functions listed in the guide.
