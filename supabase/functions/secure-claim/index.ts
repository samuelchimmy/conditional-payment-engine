import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1"
import { verifyMessage } from "npm:viem@2.21.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
      return new Response(JSON.stringify({ error: "Invalid request. Action must be 'claim-all' and walletAddress, signature, message are required." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // 1. Verify EVM Signature to mathematically prove wallet ownership
    const isValidSignature = await verifyMessage({
      address: walletAddress,
      message,
      signature
    });

    if (!isValidSignature) {
      return new Response(JSON.stringify({ error: "Invalid signature. Cannot verify wallet ownership." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // Protect against replay attacks (in production you'd use a nonce or timestamp in the message)
    if (!message.includes("Claim IOUs for") || !message.includes(walletAddress)) {
      return new Response(JSON.stringify({ error: "Invalid message format." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // 2. Fetch the caller's wallet profile to get linked social identities
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("wallet_profiles")
      .select("wallet_address, discord_id, x_user_id, telegram_id")
      .eq("wallet_address", walletAddress)
      .maybeSingle()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Wallet profile not found. Please link social accounts first." }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    let claimedCount = 0;
    let totalClaimedAmount = 0;

    // Check all possible linked identities
    const linkedIdentities = [];
    if (profile.discord_id) linkedIdentities.push({ platform: "discord", id: profile.discord_id });
    if (profile.x_user_id) linkedIdentities.push({ platform: "x", id: profile.x_user_id });
    if (profile.telegram_id) linkedIdentities.push({ platform: "telegram", id: profile.telegram_id });

    if (linkedIdentities.length === 0) {
      return new Response(JSON.stringify({ error: "No social identities linked to this wallet." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
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
          // Update IOU
          await supabaseAdmin.from("ious").update({
            status: "claimed",
            recipient_wallet: walletAddress,
            claimed_at: new Date().toISOString(),
          }).eq("id", iou.id);

          // Log Transaction
          await supabaseAdmin.from("transactions").insert({
            profile_id: profile.id, // Or just use wallet_address depending on schema
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

    return new Response(JSON.stringify({ 
      success: true, 
      claimedCount,
      totalClaimedAmount,
      message: claimedCount > 0 
        ? `Successfully securely claimed ${claimedCount} IOUs totaling ${totalClaimedAmount} USDT` 
        : `No pending IOUs found for your linked accounts.`
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error) {
    console.error("Secure Claim Error:", error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal Server Error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})
