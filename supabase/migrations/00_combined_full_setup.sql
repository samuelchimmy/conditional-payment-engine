-- ═══════════════════════════════════════════════════════════════════
-- Master Schema Setup & Update
-- This file is 100% idempotent. It safely creates missing tables,
-- adds missing columns, drops insecure RLS policies, and enforces
-- the hardened Edge-Function-only security model.
-- ═══════════════════════════════════════════════════════════════════

-- 1. Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Base Table Creation (Skips if they already exist)
CREATE TABLE IF NOT EXISTS public.wallet_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  discord_id text,
  x_user_id text,
  x_username text,
  x_verified boolean DEFAULT false,
  telegram_id text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conditional_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iou_id text,
  platform text,
  sender_id text,
  recipient_handle text,
  amount numeric,
  currency text DEFAULT 'USDT',
  condition_str text,
  condition_meta jsonb,
  status text DEFAULT 'pending',
  tx_hash text,
  resolved_in_favor integer,
  resolution_tx text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  message_id text NOT NULL,
  user_id text NOT NULL,
  intent_type text,
  amount numeric,
  recipient text,
  tx_hash text,
  error_reason text,
  replied boolean DEFAULT false,
  retry_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sports_match_results (
  id SERIAL PRIMARY KEY,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  status TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(home_team, away_team)
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.wallet_profiles(id),
  type text NOT NULL,
  amount numeric NOT NULL,
  counterparty text,
  source text,
  status text DEFAULT 'completed',
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.siwe_nonces (
  wallet_address TEXT PRIMARY KEY,
  nonce TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add any missing columns (Safe to run on existing tables)
-- wallet_profiles additions
ALTER TABLE public.wallet_profiles ADD COLUMN IF NOT EXISTS telegram_username TEXT;
ALTER TABLE public.wallet_profiles ADD COLUMN IF NOT EXISTS discord_username TEXT;
ALTER TABLE public.wallet_profiles ADD COLUMN IF NOT EXISTS google_email TEXT;
ALTER TABLE public.wallet_profiles ADD COLUMN IF NOT EXISTS google_picture TEXT;
ALTER TABLE public.wallet_profiles ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.wallet_profiles ADD COLUMN IF NOT EXISTS payment_alerts_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.wallet_profiles ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.wallet_profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- conditional_payments additions
ALTER TABLE public.conditional_payments ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE public.conditional_payments ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
ALTER TABLE public.conditional_payments ADD COLUMN IF NOT EXISTS recipient_wallet TEXT;

-- agent_transactions additions
ALTER TABLE public.agent_transactions ADD COLUMN IF NOT EXISTS condition_str TEXT;
ALTER TABLE public.agent_transactions ADD COLUMN IF NOT EXISTS parsed_at TIMESTAMPTZ;
ALTER TABLE public.agent_transactions ADD COLUMN IF NOT EXISTS iou_id TEXT;
ALTER TABLE public.agent_transactions ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;

-- sports_match_results additions
ALTER TABLE public.sports_match_results ADD COLUMN IF NOT EXISTS match_date TIMESTAMPTZ;
ALTER TABLE public.sports_match_results ADD COLUMN IF NOT EXISTS tournament TEXT;
ALTER TABLE public.sports_match_results ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.sports_match_results ADD COLUMN IF NOT EXISTS winner TEXT;

-- 4. Drop insecure / old RLS policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.wallet_profiles;
DROP POLICY IF EXISTS "Payments are viewable by everyone." ON public.conditional_payments;
DROP POLICY IF EXISTS "Transactions are viewable by everyone." ON public.transactions;
DROP POLICY IF EXISTS "Public view for conditional_payments" ON public.conditional_payments;
DROP POLICY IF EXISTS "Public view for agent_transactions" ON public.agent_transactions;
DROP POLICY IF EXISTS "Allow inserts conditional_payments" ON public.conditional_payments;
DROP POLICY IF EXISTS "Allow public insert wallet_profiles" ON public.wallet_profiles;
DROP POLICY IF EXISTS "Allow owner select wallet_profiles" ON public.wallet_profiles;
DROP POLICY IF EXISTS "Allow owner update wallet_profiles" ON public.wallet_profiles;
DROP POLICY IF EXISTS "wallet_profiles_anon_insert" ON public.wallet_profiles;
DROP POLICY IF EXISTS "wallet_profiles_anon_select" ON public.wallet_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.wallet_profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.wallet_profiles;
DROP POLICY IF EXISTS "Users can view own profile." ON public.wallet_profiles;
DROP POLICY IF EXISTS "conditional_payments_anon_select" ON public.conditional_payments;
DROP POLICY IF EXISTS "conditional_payments_anon_insert" ON public.conditional_payments;
DROP POLICY IF EXISTS "Allow public insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow public insert agent_transactions" ON public.agent_transactions;
DROP POLICY IF EXISTS "siwe_nonces_public" ON public.siwe_nonces;

-- 5. Hardened Security Lockdown (Enforce Edge Function proxy pattern)
ALTER TABLE public.wallet_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wallet_profiles FROM anon;
REVOKE ALL ON public.wallet_profiles FROM authenticated;
GRANT ALL ON public.wallet_profiles TO service_role;

ALTER TABLE public.conditional_payments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.conditional_payments FROM anon;
REVOKE ALL ON public.conditional_payments FROM authenticated;
GRANT ALL ON public.conditional_payments TO service_role;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.transactions FROM anon;
REVOKE ALL ON public.transactions FROM authenticated;
GRANT ALL ON public.transactions TO service_role;

ALTER TABLE public.agent_transactions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agent_transactions FROM anon;
REVOKE ALL ON public.agent_transactions FROM authenticated;
GRANT ALL ON public.agent_transactions TO service_role;

ALTER TABLE public.sports_match_results ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sports_match_results FROM anon;
REVOKE ALL ON public.sports_match_results FROM authenticated;
GRANT ALL ON public.sports_match_results TO service_role;

ALTER TABLE public.siwe_nonces ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.siwe_nonces FROM anon;
REVOKE ALL ON public.siwe_nonces FROM authenticated;
GRANT ALL ON public.siwe_nonces TO service_role;

-- Grant usage on sequences so SERIAL works for service_role
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
