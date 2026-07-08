"use client";

import { supabase } from "@/lib/supabaseClient";

/**
 * Ensures a WDK wallet has enough native CELO to sign its own transactions.
 *
 * Tether Arena keeps signing inside WDK (self-custodial). Because WDK's EVM
 * module can't pay gas in USDT (no CIP-64), a brand-new wallet needs a tiny
 * CELO drip to sign its first approve/withdraw. This calls the
 * `activation-funder` edge function, which drips CELO from a funder wallet
 * once per wallet (with server-side guardrails).
 *
 * Safe to call repeatedly — the edge function is idempotent and returns
 * `alreadyFunded` when the wallet can already pay gas.
 */
export async function ensureGasForWallet(
  walletAddress: string,
  opts?: { deviceId?: string; waitMs?: number },
): Promise<{ ok: boolean; funded: boolean; error?: string }> {
  if (!walletAddress) return { ok: false, funded: false, error: "no wallet" };

  try {
    // The funder now requires the SIWE JWT (proves this wallet's ownership) so
    // it can't be abused to drain the funder to arbitrary addresses.
    const token = typeof window !== "undefined" ? localStorage.getItem("tarena_jwt") : null;
    const { data, error } = await supabase.functions.invoke("activation-funder", {
      body: { action: "fund", walletAddress, deviceId: opts?.deviceId ?? null },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (error) {
      console.error("[gasGuard] activation-funder error:", error);
      return { ok: false, funded: false, error: error.message };
    }
    if (data?.error) {
      console.error("[gasGuard] activation-funder api error:", data.error);
      return { ok: false, funded: false, error: data.error };
    }

    // Already had gas, or already activated previously — nothing to wait for.
    if (data?.alreadyFunded || data?.alreadyRequested) {
      return { ok: true, funded: false };
    }

    if (data?.funded) {
      // Give the drip a moment to land before the caller signs (Celo ~5s blocks fast).
      if (!data?.confirmed && opts?.waitMs) {
        await new Promise((r) => setTimeout(r, opts.waitMs));
      }
      return { ok: true, funded: true };
    }

    return { ok: false, funded: false, error: "activation did not complete" };
  } catch (e: any) {
    console.error("[gasGuard] unexpected:", e);
    return { ok: false, funded: false, error: e?.message || "unknown" };
  }
}
