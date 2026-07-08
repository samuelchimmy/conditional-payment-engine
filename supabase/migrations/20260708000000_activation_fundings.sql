-- ═══════════════════════════════════════════════════════════════════
-- Migration: activation_fundings (gas-drip audit trail + guardrails)
-- Backs the activation-funder edge function that drips a little CELO to
-- every newly created WDK wallet so users never need to buy CELO for gas.
-- Safe to run multiple times (IF NOT EXISTS guards).
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.activation_fundings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  chain          TEXT NOT NULL DEFAULT 'celo',
  status         TEXT NOT NULL DEFAULT 'pending',   -- pending | funded | failed
  amount_wei     TEXT,                              -- drip amount, stringified bigint
  tx_hash        TEXT,
  device_id      TEXT,                              -- optional client fingerprint (abuse guard)
  error_reason   TEXT,
  funded_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- One funding row per wallet+chain (the guardrail: a wallet can only be activated once)
CREATE UNIQUE INDEX IF NOT EXISTS activation_fundings_wallet_chain_uq
  ON public.activation_fundings (lower(wallet_address), chain);

CREATE INDEX IF NOT EXISTS activation_fundings_device_idx
  ON public.activation_fundings (device_id, chain);

-- Lock it down — only service_role (the edge function) may read/write.
ALTER TABLE public.activation_fundings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.activation_fundings FROM anon;
REVOKE ALL ON public.activation_fundings FROM authenticated;
