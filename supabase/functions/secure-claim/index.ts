import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1"
import { verifyMessage } from "npm:viem@2.21.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

// In-memory nonce store (single-use claim prevention)
const usedNonces = new Map<string, number>(); // nonce → timestamp used

function cleanExpiredNonces() {
  const cutoff = Date.now() - 86_400_000;
  for (const [nonce, ts] of usedNonces.entries()) {
    if (ts < cutoff) usedNonces.delete(nonce);
  }
}

// Extract and validate timestamp from the signed message
// Expected format: "Claim IOUs for 0xADDRESS at TIMESTAMP"
function extractMessageTimestamp(message: string): number | null {
  const match = message.match(/at (\d{10,13})$/) || message.match(/at (.+)$/);
  if (!match) return null;
  // Handle both numeric timestamps and ISO strings
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

    const { action, walletAddress, signature, message, betId } = await req.json()

    // Accept both "claim-all" (dashboard) and "claim-single" (individual bet)
    if (!["claim-all", "claim-single"].includes(action) || !walletAddress || !signature || !message) {
      return jsonResp({ error: "Invalid request. walletAddress, signature, and message are required." }, 400)
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

    // Timestamp validation — message must include a recent timestamp
    const msgTimestamp = extractMessageTimestamp(message);
    if (!msgTimestamp) {
      return jsonResp({ error: "Message must include a timestamp." }, 400)
    }
    const ageMs = Date.now() - (msgTimestamp > 1e12 ? msgTimestamp : msgTimestamp * 1000);
    if (ageMs < 0 || ageMs > 300_000) { // 5-minute window
      return jsonResp({ error: "Claim message has expired. Please re-sign with a fresh timestamp." }, 400)
    }

    // Nonce check — prevent replay of the same signed message
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
      .ilike("wallet_address", walletAddress.toLowerCase())
      .maybeSingle()

    if (profileError || !profile) {
      return jsonResp({ error: "Wallet profile not found. Please link social accounts first." }, 404)
    }

    let claimedCount = 0;
    let totalClaimedAmount = 0;

    // Build query depending on action
    if (action === "claim-single" && betId) {
      // Claim a specific conditional payment by ID
      const { data: payment, error: paymentErr } = await supabaseAdmin
        .from("conditional_payments")
        .select("*")
        .eq("id", betId)
        .eq("status", "pending")
        .maybeSingle();

      if (paymentErr || !payment) {
        return jsonResp({ error: "Payment not found or already claimed." }, 404)
      }

      // Verify the claimer is the recipient by checking linked identities
      const linkedIds = [
        profile.discord_id,
        profile.x_user_id,
        profile.telegram_id,
        walletAddress.toLowerCase(),
        walletAddress,
      ].filter(Boolean).map(String);

      const recipientNumeric = (payment.recipient_numeric_id || "").toLowerCase();
      const recipientHandle = (payment.recipient_handle || "").toLowerCase();
      
      const isRecipient =
        linkedIds.some(id => id.toLowerCase() === recipientNumeric) ||
        linkedIds.some(id => id.toLowerCase() === recipientHandle) ||
        (payment.recipient_wallet && payment.recipient_wallet.toLowerCase() === walletAddress.toLowerCase());

      if (!isRecipient) {
        return jsonResp({ error: "You are not the recipient of this payment." }, 403)
      }

      // Mark as claimed
      await supabaseAdmin.from("conditional_payments").update({
        status: "claimed",
        recipient_wallet: walletAddress,
        claimed_at: new Date().toISOString(),
      }).eq("id", payment.id);

      // Log transaction
      await supabaseAdmin.from("transactions").insert({
        profile_id: profile.id,
        type: "iou_claim",
        amount: payment.amount,
        counterparty: payment.sender_id,
        source: "conditional_payment",
        status: "completed",
        metadata: { iou_id: payment.iou_id, platform: payment.platform, bet_id: payment.id },
      });

      claimedCount = 1;
      totalClaimedAmount = Number(payment.amount);

    } else {
      // claim-all: claim all pending conditional_payments across all linked identities
      const linkedIdentities: { platform: string; id: string }[] = [];
      if (profile.discord_id) linkedIdentities.push({ platform: "discord", id: profile.discord_id });
      if (profile.x_user_id) linkedIdentities.push({ platform: "x", id: profile.x_user_id });
      if (profile.telegram_id) linkedIdentities.push({ platform: "telegram", id: profile.telegram_id });

      if (linkedIdentities.length === 0) {
        return jsonResp({ error: "No social identities linked to this wallet." }, 403)
      }

      for (const identity of linkedIdentities) {
        // Query conditional_payments where recipient_numeric_id OR recipient_handle matches the linked social ID
        // Supabase `or` syntax requires a string like `recipient_numeric_id.eq.123,recipient_handle.eq.123`
        const { data: pendingPayments } = await supabaseAdmin
          .from("conditional_payments")
          .select("*")
          .eq("platform", identity.platform)
          .or(`recipient_numeric_id.eq.${identity.id},recipient_handle.eq.${identity.id}`)
          .eq("status", "pending")

        if (pendingPayments && pendingPayments.length > 0) {
          for (const payment of pendingPayments) {
            await supabaseAdmin.from("conditional_payments").update({
              status: "claimed",
              recipient_wallet: walletAddress,
              claimed_at: new Date().toISOString(),
            }).eq("id", payment.id);

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
          }
        }
      }
    }

    return jsonResp({
      success: true,
      claimedCount,
      totalClaimedAmount,
      message: claimedCount > 0
        ? `Successfully claimed ${claimedCount} payment(s) totaling ${totalClaimedAmount} USDT`
        : `No pending payments found for your linked accounts.`
    })

  } catch (error) {
    console.error("Secure Claim Error:", error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal Server Error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})
