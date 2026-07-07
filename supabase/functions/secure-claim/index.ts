import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1"
import { verifyMessage } from "npm:viem@2.21.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

// C3: In-memory nonce store (single-use claim prevention)
// Each nonce is the SHA-256 hash of the signed message — prevents replay
const usedNonces = new Map<string, number>(); // nonce → timestamp used

// Clean up nonces older than 24 hours
function cleanExpiredNonces() {
  const cutoff = Date.now() - 86_400_000;
  for (const [nonce, ts] of usedNonces.entries()) {
    if (ts < cutoff) usedNonces.delete(nonce);
  }
}

// C3: Extract and validate timestamp from the signed message
// Expected format: "Claim IOUs for 0xADDRESS at TIMESTAMP"
function extractMessageTimestamp(message: string): number | null {
  const match = message.match(/at (\d{10,13})$/);
  if (!match) return null;
  return parseInt(match[1], 10);
}

function jsonResp(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables")
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { action, walletAddress, signature, message } = await req.json()

    if (action !== "claim-all" || !walletAddress || !signature || !message) {
      return jsonResp({ error: "Invalid request. Action must be 'claim-all' and walletAddress, signature, message are required." }, 400)
    }

    // 1. Verify EVM Signature
    const isValidSignature = await verifyMessage({
      address: walletAddress,
      message,
      signature
    });

    if (!isValidSignature) {
      return jsonResp({ error: "Invalid signature. Cannot verify wallet ownership." }, 401)
    }

    // 2. Validate message format
    if (!message.includes("Claim IOUs for") || !message.toLowerCase().includes(walletAddress.toLowerCase())) {
      return jsonResp({ error: "Invalid message format." }, 400)
    }

    // C3: Timestamp validation — message must include a recent timestamp
    // Format: "Claim IOUs for 0xADDRESS at 1720000000000"
    const msgTimestamp = extractMessageTimestamp(message);
    if (!msgTimestamp) {
      return jsonResp({ error: "Message must include a timestamp: 'Claim IOUs for 0xADDRESS at TIMESTAMP'" }, 400)
    }
    const ageMs = Date.now() - (msgTimestamp > 1e12 ? msgTimestamp : msgTimestamp * 1000);
    if (ageMs < 0 || ageMs > 300_000) { // 5-minute window
      return jsonResp({ error: "Claim message has expired. Please re-sign with a fresh timestamp." }, 400)
    }

    // C3: Nonce check — prevent replay of the same signed message
    // Use SHA-256 of the signature as the nonce
    const sigBytes = new TextEncoder().encode(signature);
    const nonceBuffer = await crypto.subtle.digest("SHA-256", sigBytes);
    const nonce = Array.from(new Uint8Array(nonceBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    if (usedNonces.has(nonce)) {
      return jsonResp({ error: "This signed message has already been used. Please sign a new claim request." }, 400)
    }

    // Mark nonce as used immediately to prevent race conditions
    usedNonces.set(nonce, Date.now());
    cleanExpiredNonces();

    // 3. Fetch the caller's wallet profile to get linked social identities
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("wallet_profiles")
      .select("id, wallet_address, discord_id, x_user_id, telegram_id")
      .eq("wallet_address", walletAddress)
      .maybeSingle()

    if (profileError || !profile) {
      return jsonResp({ error: "Wallet profile not found. Please link social accounts first." }, 404)
    }

    let claimedCount = 0;
    let totalClaimedAmount = 0;

    // Check all possible linked identities
    const linkedIdentities = [];
    if (profile.discord_id) linkedIdentities.push({ platform: "discord", id: profile.discord_id });
    if (profile.x_user_id) linkedIdentities.push({ platform: "x", id: profile.x_user_id });
    if (profile.telegram_id) linkedIdentities.push({ platform: "telegram", id: profile.telegram_id });

    if (linkedIdentities.length === 0) {
      return jsonResp({ error: "No social identities linked to this wallet." }, 403)
    }

    for (const identity of linkedIdentities) {
      const { data: pendingIOUs } = await supabaseAdmin
        .from("ious")
        .select("*")
        .eq("platform", identity.platform)
        .eq("platform_user_id", String(identity.id))
        .eq("status", "pending")

      if (pendingIOUs && pendingIOUs.length > 0) {
        for (const iou of pendingIOUs) {
          // Update IOU status to claimed
          await supabaseAdmin.from("ious").update({
            status: "claimed",
            recipient_wallet: walletAddress,
            claimed_at: new Date().toISOString(),
          }).eq("id", iou.id);

          // Log Transaction
          await supabaseAdmin.from("transactions").insert({
            profile_id: profile.id,
            type: "iou_claim",
            amount: iou.amount,
            counterparty: iou.sender_pay_tag,
            source: "iou",
            status: "completed",
            metadata: { iou_id: iou.iou_id, chain: iou.chain, platform: iou.platform },
          });

          claimedCount++;
          totalClaimedAmount += Number(iou.amount);
        }
      }
    }

    return jsonResp({
      success: true,
      claimedCount,
      totalClaimedAmount,
      message: claimedCount > 0
        ? `Successfully securely claimed ${claimedCount} IOUs totaling ${totalClaimedAmount} USDT`
        : `No pending IOUs found for your linked accounts.`
    })

  } catch (error) {
    console.error("Secure Claim Error:", error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal Server Error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})
