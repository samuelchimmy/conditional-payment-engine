-- ═══════════════════════════════════════════════════════════════════
-- Migration: claim_nonces — persistent single-use guard for secure-claim
-- The claim function previously stored used nonces in memory, so a cold
-- start reset them and a signature could be replayed within its 5-min window.
-- This table makes replay protection durable. Service-role only.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.claim_nonces (
  nonce      TEXT PRIMARY KEY,
  used_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.claim_nonces ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.claim_nonces FROM anon;
REVOKE ALL ON public.claim_nonces FROM authenticated;
GRANT ALL ON public.claim_nonces TO service_role;
