-- Drop insecure public SELECT policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.wallet_profiles;
DROP POLICY IF EXISTS "Payments are viewable by everyone." ON public.conditional_payments;
DROP POLICY IF EXISTS "Transactions are viewable by everyone." ON public.transactions;

-- Drop hackathon hotfix policies
DROP POLICY IF EXISTS "Public view for conditional_payments" ON public.conditional_payments;
DROP POLICY IF EXISTS "Public view for agent_transactions" ON public.agent_transactions;
DROP POLICY IF EXISTS "Allow inserts conditional_payments" ON public.conditional_payments;

-- Enable RLS (already enabled, but good to be explicit)
ALTER TABLE public.wallet_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conditional_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_transactions ENABLE ROW LEVEL SECURITY;

-- Create SIWE nonces table for session auth
CREATE TABLE IF NOT EXISTS public.siwe_nonces (
  wallet_address text PRIMARY KEY,
  nonce text NOT NULL,
  expires_at timestamp with time zone NOT NULL
);
ALTER TABLE public.siwe_nonces ENABLE ROW LEVEL SECURITY;

-- Note: No new policies are created because the frontend is mandated
-- to NEVER communicate directly with the DB. All database access 
-- will be via Supabase Edge Functions using the service_role key, 
-- which bypasses RLS by default.
