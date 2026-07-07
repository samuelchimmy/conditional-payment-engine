-- ═══════════════════════════════════════════════════════════════════
-- Migration: Hardened RLS - Full lockdown of all tables for anon/authenticated
-- All reads and writes MUST go through Edge Functions (service_role key).
-- The anon key has ZERO direct table access.
-- ═══════════════════════════════════════════════════════════════════

-- ─── wallet_profiles ────────────────────────────────────────────────
ALTER TABLE public.wallet_profiles ENABLE ROW LEVEL SECURITY;

-- Drop any remaining permissive policies
DROP POLICY IF EXISTS "Allow public insert wallet_profiles" ON public.wallet_profiles;
DROP POLICY IF EXISTS "Allow owner select wallet_profiles" ON public.wallet_profiles;
DROP POLICY IF EXISTS "Allow owner update wallet_profiles" ON public.wallet_profiles;
DROP POLICY IF EXISTS "wallet_profiles_anon_insert" ON public.wallet_profiles;
DROP POLICY IF EXISTS "wallet_profiles_anon_select" ON public.wallet_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.wallet_profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.wallet_profiles;
DROP POLICY IF EXISTS "Users can view own profile." ON public.wallet_profiles;

-- Revoke all direct table access from anon and authenticated roles
REVOKE ALL ON public.wallet_profiles FROM anon;
REVOKE ALL ON public.wallet_profiles FROM authenticated;
-- Only service_role (used by Edge Functions) can access
GRANT ALL ON public.wallet_profiles TO service_role;

-- ─── conditional_payments ───────────────────────────────────────────
ALTER TABLE public.conditional_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert conditional_payments" ON public.conditional_payments;
DROP POLICY IF EXISTS "Allow inserts conditional_payments" ON public.conditional_payments;
DROP POLICY IF EXISTS "Public view for conditional_payments" ON public.conditional_payments;
DROP POLICY IF EXISTS "Payments are viewable by everyone." ON public.conditional_payments;
DROP POLICY IF EXISTS "conditional_payments_anon_select" ON public.conditional_payments;
DROP POLICY IF EXISTS "conditional_payments_anon_insert" ON public.conditional_payments;

REVOKE ALL ON public.conditional_payments FROM anon;
REVOKE ALL ON public.conditional_payments FROM authenticated;
GRANT ALL ON public.conditional_payments TO service_role;

-- ─── transactions ────────────────────────────────────────────────────
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Transactions are viewable by everyone." ON public.transactions;
DROP POLICY IF EXISTS "Allow public insert transactions" ON public.transactions;

REVOKE ALL ON public.transactions FROM anon;
REVOKE ALL ON public.transactions FROM authenticated;
GRANT ALL ON public.transactions TO service_role;

-- ─── agent_transactions ─────────────────────────────────────────────
ALTER TABLE public.agent_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view for agent_transactions" ON public.agent_transactions;
DROP POLICY IF EXISTS "Allow public insert agent_transactions" ON public.agent_transactions;

REVOKE ALL ON public.agent_transactions FROM anon;
REVOKE ALL ON public.agent_transactions FROM authenticated;
GRANT ALL ON public.agent_transactions TO service_role;

-- ─── siwe_nonces ────────────────────────────────────────────────────
ALTER TABLE public.siwe_nonces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "siwe_nonces_public" ON public.siwe_nonces;

REVOKE ALL ON public.siwe_nonces FROM anon;
REVOKE ALL ON public.siwe_nonces FROM authenticated;
GRANT ALL ON public.siwe_nonces TO service_role;

-- ─── Confirm no leftover permissive catch-all exists ─────────────────
-- Deny all is the default when RLS is enabled and no ALLOW policy exists.
-- service_role bypasses RLS by design (Supabase default).
-- All frontend access MUST be via Edge Functions using service_role key.
