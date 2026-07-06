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

-- Create ious table
CREATE TABLE IF NOT EXISTS public.ious (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iou_id text, -- ID from the blockchain contract if available
  sender_wallet text NOT NULL,
  sender_pay_tag text,
  recipient_wallet text, -- Can be null initially before claim
  platform text NOT NULL, -- discord, x, telegram
  platform_user_id text NOT NULL, -- ID of the user on that platform
  amount numeric NOT NULL,
  chain text,
  status text DEFAULT 'pending', -- pending, claimed
  created_at timestamp with time zone DEFAULT now(),
  claimed_at timestamp with time zone
);

-- Create transactions table
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
ALTER TABLE public.ious ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Allow read access for everyone (or restrict as needed in production)
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.wallet_profiles FOR SELECT
  USING ( true );

CREATE POLICY "IOUs are viewable by everyone."
  ON public.ious FOR SELECT
  USING ( true );

CREATE POLICY "Transactions are viewable by everyone."
  ON public.transactions FOR SELECT
  USING ( true );
