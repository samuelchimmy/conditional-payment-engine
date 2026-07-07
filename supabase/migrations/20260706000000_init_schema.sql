-- Enable the pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create wallet_profiles table
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

-- Create conditional_payments table (replaces ious)
CREATE TABLE IF NOT EXISTS public.conditional_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iou_id text, -- ID from the blockchain contract
  platform text NOT NULL,
  sender_id text NOT NULL,
  recipient_handle text,
  amount numeric NOT NULL,
  currency text DEFAULT 'USDT',
  condition_str text,
  condition_meta jsonb,
  status text DEFAULT 'pending', -- pending, resolved, claimed
  tx_hash text,
  resolved_in_favor integer,
  resolution_tx text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create agent_transactions table (Social Queue)
CREATE TABLE IF NOT EXISTS public.agent_transactions (
    id SERIAL PRIMARY KEY,
    platform TEXT NOT NULL,
    message_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    intent_type TEXT,
    amount NUMERIC,
    recipient TEXT,
    tx_hash TEXT,
    error_reason TEXT,
    replied BOOLEAN DEFAULT false,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_transactions_unreplied ON public.agent_transactions(replied, retry_count) WHERE replied = false;

-- Create sports_match_results table (Oracle)
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

-- Create transactions table (for standard transfers)
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.wallet_profiles(id),
  type text NOT NULL, -- iou_claim, deposit, withdraw
  amount numeric NOT NULL,
  counterparty text,
  source text,
  status text DEFAULT 'completed',
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS policies
ALTER TABLE public.wallet_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conditional_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Allow read access for everyone (or restrict as needed in production)
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.wallet_profiles FOR SELECT
  USING ( true );

CREATE POLICY "Payments are viewable by everyone."
  ON public.conditional_payments FOR SELECT
  USING ( true );

CREATE POLICY "Transactions are viewable by everyone."
  ON public.transactions FOR SELECT
  USING ( true );
