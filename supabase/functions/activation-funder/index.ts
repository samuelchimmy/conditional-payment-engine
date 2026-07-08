// ═══════════════════════════════════════════════════════════════════
// activation-funder — Celo gas drip for newly created WDK wallets
//
// Tether Arena keeps signing inside WDK (self-custodial). WDK's EVM module
// can't do CIP-64 (gas-in-USDT), so a brand-new WDK wallet needs a tiny bit
// of native CELO to sign its FIRST transaction (the ERC-20 approve). This
// function drips that CELO from a single funder wallet, once per wallet,
// with guardrails so the funder can't be drained.
//
// After activation the user signs with WDK as normal; the bot executor path
// remains gasless via CIP-64 (USDT fee-currency adapter).
//
// Secrets required:
//   ACTIVATION_FUNDER_PRIVATE_KEY   — funder EOA (holds CELO)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Optional:
//   CELO_RPC_URL                    — defaults to https://forno.celo.org
// ═══════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import {
  createPublicClient,
  createWalletClient,
  http,
  fallback,
  parseEther,
  formatEther,
  isAddress,
} from "npm:viem@2.21.0";
import { privateKeyToAccount } from "npm:viem@2.21.0/accounts";
import { celo } from "npm:viem@2.21.0/chains";
import { jwtVerify } from "https://deno.land/x/jose@v4.14.4/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Guardrail constants ──────────────────────────────────────────────
// If the wallet already holds >= MIN_REQUIRED CELO, we don't fund (it can
// already pay gas). FUNDING_AMOUNT is the drip size — enough for several txs.
const MIN_REQUIRED = parseEther("0.02"); // 0.02 CELO
const FUNDING_AMOUNT = parseEther("0.05"); // drip 0.05 CELO
// Keep the funder from bleeding out: refuse if funder balance would drop
// below this floor after a drip.
const FUNDER_MIN_FLOOR = parseEther("0.05");

// RPC failover — env-first, then public fallbacks (a single RPC hiccup
// shouldn't block wallet activation).
const CELO_RPCS = [
  Deno.env.get("CELO_RPC_URL"),
  "https://forno.celo.org",
  "https://rpc.ankr.com/celo",
  "https://1rpc.io/celo",
].filter(Boolean) as string[];

function celoTransport() {
  // viem fallback: tries each RPC in order on failure.
  return CELO_RPCS.length > 1
    ? fallback(CELO_RPCS.map((u) => http(u)))
    : http(CELO_RPCS[0]);
}

function jsonResp(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const funderKey = Deno.env.get("ACTIVATION_FUNDER_PRIVATE_KEY");

    if (!supabaseUrl || !serviceKey) return jsonResp({ error: "Server not configured (db)" }, 500);
    if (!funderKey) return jsonResp({ error: "Server not configured (funder)" }, 500);

    const db = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const action: string = body.action || "fund";
    const walletAddress: string = (body.walletAddress || "").trim();
    const deviceId: string | null = body.deviceId ?? null;

    if (!isAddress(walletAddress)) {
      return jsonResp({ error: "Valid walletAddress required" }, 400);
    }
    const wallet = walletAddress as `0x${string}`;

    // ── AUTH: only the wallet's owner may request a drip to it (CR-3). ──
    // Requires the SIWE JWT (same token db-proxy issues), and the token's
    // wallet_address must equal the wallet being funded. This stops an attacker
    // from draining the funder to unlimited addresses they don't control.
    // Read actions (balance/status) are harmless and left open.
    if (action === "fund") {
      const jwtSecret = Deno.env.get("JWT_SECRET");
      // CR-4: never fall back to a shipped default secret.
      if (!jwtSecret) return jsonResp({ error: "Server auth not configured" }, 500);

      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return jsonResp({ error: "Authentication required" }, 401);
      }
      try {
        const token = authHeader.split(" ")[1];
        const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret));
        if (String(payload.wallet_address).toLowerCase() !== wallet.toLowerCase()) {
          return jsonResp({ error: "Token does not match wallet" }, 403);
        }
      } catch {
        return jsonResp({ error: "Invalid or expired token" }, 401);
      }
    }

    const publicClient = createPublicClient({ chain: celo, transport: celoTransport() });

    // ── checkStatus: read current on-chain gas + DB row ────────────────
    const onchain = await publicClient.getBalance({ address: wallet });
    const hasEnough = onchain >= MIN_REQUIRED;

    // ── checkGasBalance: lightweight on-chain gas probe (no DB write) ───
    if (action === "checkGasBalance" || action === "checkEthBalance") {
      return jsonResp({
        walletAddress: wallet,
        balanceWei: onchain.toString(),
        balanceCelo: formatEther(onchain),
        hasEnoughForActivation: hasEnough,
      });
    }

    if (action === "checkStatus") {
      const { data: row } = await db
        .from("activation_fundings")
        .select("status, tx_hash, funded_at")
        .eq("wallet_address", wallet.toLowerCase())
        .eq("chain", "celo")
        .maybeSingle();
      return jsonResp({
        walletAddress: wallet,
        balanceCelo: formatEther(onchain),
        hasEnoughForGas: hasEnough,
        activation: row ?? null,
      });
    }

    // ── fund: the main entrypoint ──────────────────────────────────────
    if (action !== "fund") return jsonResp({ error: "Unknown action" }, 400);

    // Guardrail 1: already has gas → nothing to do (sync DB, return).
    if (hasEnough) {
      await db.from("activation_fundings").upsert(
        {
          wallet_address: wallet.toLowerCase(),
          chain: "celo",
          status: "funded",
          funded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "wallet_address,chain" },
      );
      return jsonResp({ alreadyFunded: true, balanceCelo: formatEther(onchain) });
    }

    // Guardrail 2: one activation per wallet+chain. If a prior row is already
    // 'funded' or 'pending', don't drip again (idempotent; blocks re-drip abuse).
    const { data: existing } = await db
      .from("activation_fundings")
      .select("id, status")
      .eq("wallet_address", wallet.toLowerCase())
      .eq("chain", "celo")
      .maybeSingle();

    if (existing && (existing.status === "funded" || existing.status === "pending")) {
      return jsonResp({
        alreadyRequested: true,
        status: existing.status,
        message: "This wallet was already activated.",
      });
    }

    // Reserve the slot (pending) BEFORE sending — prevents double-drip on retries.
    await db.from("activation_fundings").upsert(
      {
        wallet_address: wallet.toLowerCase(),
        chain: "celo",
        status: "pending",
        amount_wei: FUNDING_AMOUNT.toString(),
        device_id: deviceId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "wallet_address,chain" },
    );

    // ── Funder wallet + solvency guardrail ─────────────────────────────
    const funderAccount = privateKeyToAccount(
      (funderKey.startsWith("0x") ? funderKey : `0x${funderKey}`) as `0x${string}`,
    );
    const walletClient = createWalletClient({
      account: funderAccount,
      chain: celo,
      transport: celoTransport(),
    });

    const funderBalance = await publicClient.getBalance({ address: funderAccount.address });
    if (funderBalance < FUNDING_AMOUNT + FUNDER_MIN_FLOOR) {
      await db
        .from("activation_fundings")
        .update({ status: "failed", error_reason: "funder_empty", updated_at: new Date().toISOString() })
        .eq("wallet_address", wallet.toLowerCase())
        .eq("chain", "celo");
      return jsonResp({ error: "Activation temporarily unavailable. Please try again shortly.", funderEmpty: true }, 503);
    }

    // ── Send the drip with nonce fetch + gas-bump retry (3 attempts) ────
    let txHash: string | null = null;
    let lastErr = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const nonce = await publicClient.getTransactionCount({
          address: funderAccount.address,
          blockTag: "pending",
        });
        const gasPrice = await publicClient.getGasPrice();
        const bumped = gasPrice + (gasPrice * BigInt(25 * attempt)) / BigInt(100); // +25% per retry

        txHash = await walletClient.sendTransaction({
          to: wallet,
          value: FUNDING_AMOUNT,
          nonce,
          gasPrice: bumped,
        });
        break;
      } catch (e) {
        lastErr = (e as Error).message || String(e);
        // funder-empty is terminal, don't retry
        if (/insufficient funds/i.test(lastErr)) {
          await db
            .from("activation_fundings")
            .update({ status: "failed", error_reason: "funder_empty", updated_at: new Date().toISOString() })
            .eq("wallet_address", wallet.toLowerCase())
            .eq("chain", "celo");
          return jsonResp({ error: "Activation temporarily unavailable.", funderEmpty: true }, 503);
        }
        // otherwise loop and bump gas
      }
    }

    if (!txHash) {
      await db
        .from("activation_fundings")
        .update({ status: "failed", error_reason: lastErr.slice(0, 300), updated_at: new Date().toISOString() })
        .eq("wallet_address", wallet.toLowerCase())
        .eq("chain", "celo");
      return jsonResp({ error: "Could not activate wallet. Please try again.", detail: lastErr.slice(0, 200) }, 502);
    }

    // Mark funded (best-effort receipt wait so the client can proceed to approve).
    let confirmed = false;
    try {
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}`, timeout: 20_000 });
      confirmed = receipt.status === "success";
    } catch (_) {
      // Timed out waiting — tx is likely still pending; client will poll balance.
    }

    await db
      .from("activation_fundings")
      .update({
        status: "funded",
        tx_hash: txHash,
        funded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("wallet_address", wallet.toLowerCase())
      .eq("chain", "celo");

    return jsonResp({
      funded: true,
      txHash,
      confirmed,
      amountCelo: formatEther(FUNDING_AMOUNT),
      message: "Wallet activated with gas. You can now approve and transact.",
    });
  } catch (err) {
    console.error("[activation-funder] error:", err);
    return jsonResp({ error: (err as Error).message || "Unexpected error" }, 500);
  }
});
