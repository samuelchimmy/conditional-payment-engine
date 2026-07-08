import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1"
import { verifyMessage, createPublicClient, http, keccak256, toBytes } from "npm:viem@2.21.0"
import { celo } from "npm:viem@2.21.0/chains"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

// RECIPIENT_WIN flag from IOURegistryV3 — only recipient-win escrows are claimable.
const RECIPIENT_WIN = 2;

const CELO_RPC = Deno.env.get("CELO_RPC_URL") || "https://forno.celo.org";
const IOU_REGISTRY = Deno.env.get("IOU_REGISTRY_V3") as `0x${string}` | undefined;

// Minimal ABI to read a single IOU's on-chain truth (recipientId, resolution, claimed).
const GET_IOU_ABI = [{
  type: "function", name: "getIOU", stateMutability: "view",
  inputs: [{ name: "iouId", type: "uint256" }],
  outputs: [{
    name: "", type: "tuple", components: [
      { name: "sender", type: "address" },
      { name: "token", type: "address" },
      { name: "netAmount", type: "uint256" },
      { name: "recipientId", type: "bytes32" },
      { name: "expiry", type: "uint64" },
      { name: "claimed", type: "bool" },
      { name: "refunded", type: "bool" },
      { name: "isConditional", type: "bool" },
      { name: "conditionHash", type: "bytes32" },
      { name: "resolvedAt", type: "uint64" },
      { name: "resolvedInFavor", type: "uint8" },
    ]
  }],
}] as const;

// Same identity hash the contract was locked under: keccak256("platform:userId").
function getRecipientId(platform: string, userId: string): string {
  return keccak256(toBytes(`${platform.toLowerCase()}:${userId}`)).toLowerCase();
}

// Expected message format: "Claim IOUs for 0xADDRESS at TIMESTAMP"
function extractMessageTimestamp(message: string): number | null {
  const match = message.match(/at (\d{10,13})$/) || message.match(/at (.+)$/);
  if (!match) return null;
  const raw = match[1];
  const numeric = parseInt(raw, 10);
  if (!isNaN(numeric)) return numeric;
  const fromIso = new Date(raw).getTime();
  return isNaN(fromIso) ? null : fromIso;
}

function jsonResp(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

// Normalize a candidate identifier for comparison (lowercase, strip leading @).
function norm(v: unknown): string {
  return String(v ?? "").trim().toLowerCase().replace(/^@/, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Missing environment variables")

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { action, walletAddress, signature, message, betId } = await req.json()

    if (!["claim-all", "claim-single"].includes(action) || !walletAddress || !signature || !message) {
      return jsonResp({ error: "Invalid request. walletAddress, signature, and message are required." }, 400)
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) {
      return jsonResp({ error: "Invalid wallet address." }, 400)
    }

    // ── 1. Prove wallet ownership: the caller signed the claim message ──
    const isValidSignature = await verifyMessage({ address: walletAddress, message, signature });
    if (!isValidSignature) {
      return jsonResp({ error: "Invalid signature. Cannot verify wallet ownership." }, 401)
    }

    // ── 2. Bind the signature to this wallet + a fresh timestamp ──
    if (!message.includes("Claim IOUs for") || !message.toLowerCase().includes(walletAddress.toLowerCase())) {
      return jsonResp({ error: "Invalid message format." }, 400)
    }
    const msgTimestamp = extractMessageTimestamp(message);
    if (!msgTimestamp) return jsonResp({ error: "Message must include a timestamp." }, 400)
    const ageMs = Date.now() - (msgTimestamp > 1e12 ? msgTimestamp : msgTimestamp * 1000);
    if (ageMs < 0 || ageMs > 300_000) {
      return jsonResp({ error: "Claim message has expired. Please re-sign with a fresh timestamp." }, 400)
    }

    // ── 3. Durable single-use nonce (replay protection survives cold starts) ──
    const sigBytes = new TextEncoder().encode(signature);
    const nonceBuffer = await crypto.subtle.digest("SHA-256", sigBytes);
    const nonce = Array.from(new Uint8Array(nonceBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
    const { error: nonceErr } = await supabaseAdmin.from("claim_nonces").insert({ nonce });
    if (nonceErr) {
      // Unique-violation → this exact signature was already used.
      return jsonResp({ error: "This signed message has already been used. Please sign a new claim request." }, 400)
    }

    // ── 4. Load the caller's OAuth/HMAC-verified identities ──
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("wallet_profiles")
      .select("id, wallet_address, discord_id, discord_username, x_user_id, x_username, x_verified, telegram_id, telegram_username")
      .ilike("wallet_address", walletAddress.toLowerCase())
      .maybeSingle()

    if (profileError || !profile) {
      return jsonResp({ error: "Wallet profile not found. Please link a social account first." }, 404)
    }

    // Per-platform verified identifiers: numeric ID (immutable) + current username
    // (OAuth/HMAC-verified). X is only trusted when x_verified === true (matches
    // PayTag: an unverified X link can never claim).
    const xVerified = profile.x_verified === true;
    const identitiesByPlatform: Record<string, string[]> = {
      x: xVerified ? [profile.x_user_id, profile.x_username].map(norm).filter(Boolean) : [],
      twitter: xVerified ? [profile.x_user_id, profile.x_username].map(norm).filter(Boolean) : [],
      discord: [profile.discord_id, profile.discord_username].map(norm).filter(Boolean),
      telegram: [profile.telegram_id, profile.telegram_username].map(norm).filter(Boolean),
    };
    const allIdentities = new Set(Object.values(identitiesByPlatform).flat());

    // On-chain client (contract is the final source of truth for who can claim).
    const publicClient = IOU_REGISTRY
      ? createPublicClient({ chain: celo, transport: http(CELO_RPC) })
      : null;

    // Does this caller own the identity a given payment is addressed to?
    function isRecipientOf(payment: any): boolean {
      const plat = norm(payment.platform);
      const ids = identitiesByPlatform[plat] || Array.from(allIdentities);
      const targetNumeric = norm(payment.recipient_numeric_id);
      const targetHandle = norm(payment.recipient_handle);
      const matchesIdentity =
        (targetNumeric && ids.includes(targetNumeric)) ||
        (targetHandle && ids.includes(targetHandle));
      const matchesWallet =
        payment.recipient_wallet && norm(payment.recipient_wallet) === norm(walletAddress);
      return Boolean(matchesIdentity || matchesWallet);
    }

    // CONTRACT-AUTHORITATIVE check: read the IOU on-chain and confirm its
    // recipientId hash matches one of the caller's verified identities, that it
    // resolved in the recipient's favor, and that it isn't already claimed.
    // This makes a forged DB row insufficient to claim — the chain is the truth.
    async function verifiedOnChain(payment: any): Promise<boolean> {
      if (!publicClient || !payment.iou_id) return false;
      let iou: any;
      try {
        iou = await publicClient.readContract({
          address: IOU_REGISTRY!, abi: GET_IOU_ABI, functionName: "getIOU",
          args: [BigInt(payment.iou_id)],
        });
      } catch {
        return false; // can't read chain → deny (fail closed)
      }
      if (!iou?.isConditional || iou.claimed || iou.refunded) return false;
      if (Number(iou.resolvedInFavor) !== RECIPIENT_WIN) return false;

      // Recompute recipientId from each of the caller's verified identities and
      // require an exact match to the on-chain recipientId.
      const onchainId = String(iou.recipientId).toLowerCase();
      const plat = norm(payment.platform);
      const platformKey = plat === "twitter" ? "x" : plat;
      const candidates = identitiesByPlatform[platformKey] || Array.from(allIdentities);
      for (const id of candidates) {
        if (getRecipientId(platformKey, id) === onchainId) return true;
        // also try the raw platform label in case the IOU was keyed as "twitter:"
        if (getRecipientId(plat, id) === onchainId) return true;
      }
      return false;
    }

    // Only a resolved, recipient-won escrow can be claimed (DB-side pre-filter).
    function isClaimable(payment: any): boolean {
      return payment.status === "resolved" && Number(payment.resolved_in_favor) === RECIPIENT_WIN;
    }

    let claimedCount = 0;
    let totalClaimedAmount = 0;

    async function settleClaim(payment: any) {
      // Atomic: only flip if still 'resolved' (prevents double-claim races).
      const { data: updated } = await supabaseAdmin
        .from("conditional_payments")
        .update({ status: "claimed", recipient_wallet: walletAddress, claimed_at: new Date().toISOString() })
        .eq("id", payment.id)
        .eq("status", "resolved")
        .select();
      if (!updated || updated.length === 0) return false;

      await supabaseAdmin.from("transactions").insert({
        profile_id: profile.id,
        type: "iou_claim",
        amount: payment.amount,
        counterparty: payment.sender_id,
        source: "conditional_payment",
        status: "completed",
        metadata: { iou_id: payment.iou_id, platform: payment.platform, bet_id: payment.id },
      });
      claimedCount++;
      totalClaimedAmount += Number(payment.amount);
      return true;
    }

    if (action === "claim-single" && betId) {
      const { data: payment, error: paymentErr } = await supabaseAdmin
        .from("conditional_payments")
        .select("*")
        .eq("id", betId)
        .maybeSingle();

      if (paymentErr || !payment) return jsonResp({ error: "Payment not found." }, 404)
      if (!isClaimable(payment)) {
        return jsonResp({ error: "This payment is not ready to claim yet (it must be resolved in your favor)." }, 409)
      }
      if (!isRecipientOf(payment)) {
        return jsonResp({ error: "You are not the recipient of this payment." }, 403)
      }
      // Contract-authoritative gate: the on-chain IOU must be locked under this
      // caller's verified identity, resolved for the recipient, and unclaimed.
      if (publicClient && !(await verifiedOnChain(payment))) {
        return jsonResp({ error: "On-chain verification failed for this claim." }, 403)
      }
      const ok = await settleClaim(payment);
      if (!ok) return jsonResp({ error: "Payment already claimed." }, 409)

    } else {
      // claim-all: every resolved, recipient-won payment addressed to one of the
      // caller's verified identities.
      if (allIdentities.size === 0) {
        return jsonResp({ error: "No social identities linked to this wallet." }, 403)
      }
      const { data: candidates } = await supabaseAdmin
        .from("conditional_payments")
        .select("*")
        .eq("status", "resolved")

      for (const payment of candidates || []) {
        if (!isClaimable(payment)) continue;
        if (!isRecipientOf(payment)) continue;
        if (publicClient && !(await verifiedOnChain(payment))) continue;
        await settleClaim(payment);
      }
    }

    return jsonResp({
      success: true,
      claimedCount,
      totalClaimedAmount,
      message: claimedCount > 0
        ? `Successfully claimed ${claimedCount} payment(s) totaling ${totalClaimedAmount} USDT. Settlement to your wallet is processing.`
        : `No claimable payments found for your linked accounts.`
    })

  } catch (error) {
    console.error("Secure Claim Error:", error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal Server Error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})
