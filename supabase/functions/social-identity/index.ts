import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { platform, code, redirectUri, walletAddress } = await req.json();

    if (!platform || !code || !walletAddress) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    let socialId = null;
    let xUsername = null;

    if (platform === "discord") {
      // Exchange code for access token
      const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: Deno.env.get("DISCORD_CLIENT_ID") ?? "",
          client_secret: Deno.env.get("DISCORD_CLIENT_SECRET") ?? "",
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) throw new Error("Failed to get Discord access token");

      // Get user profile
      const userRes = await fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const userData = await userRes.json();
      socialId = userData.id;

    } else if (platform === "x") {
      // Handle Twitter/X OAuth2 PKCE or standard OAuth
      // Simplified for this template
      const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(Deno.env.get("X_CLIENT_ID") + ":" + Deno.env.get("X_CLIENT_SECRET"))}`,
        },
        body: new URLSearchParams({
          code,
          grant_type: "authorization_code",
          client_id: Deno.env.get("X_CLIENT_ID") ?? "",
          redirect_uri: redirectUri,
          code_verifier: "challenge", // Needs actual PKCE verifier in prod
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) throw new Error("Failed to get X access token");

      const userRes = await fetch("https://api.twitter.com/2/users/me", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const userData = await userRes.json();
      socialId = userData.data.id;
      xUsername = userData.data.username;
    }

    if (!socialId) {
      throw new Error("Failed to resolve social identity");
    }

    // Upsert the wallet profile
    const updateData: any = { wallet_address: walletAddress };
    if (platform === "discord") updateData.discord_id = socialId;
    if (platform === "x") {
      updateData.x_user_id = socialId;
      updateData.x_username = xUsername;
      updateData.x_verified = true;
    }
    // Telegram is usually handled via bot directly, but keeping structure generic

    const { error } = await supabaseClient
      .from("wallet_profiles")
      .upsert(updateData, { onConflict: "wallet_address" });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, socialId, xUsername }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
