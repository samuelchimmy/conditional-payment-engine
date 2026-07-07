import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/security.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DISCORD_CLIENT_ID = Deno.env.get("DISCORD_CLIENT_ID")!;
const DISCORD_CLIENT_SECRET = Deno.env.get("DISCORD_CLIENT_SECRET")!;

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { code, redirectUri, profileId, walletAddress } = await req.json();

    if (!code || typeof code !== "string") return jsonResponse({ error: "Authorization code is required" }, 400);
    if (!walletAddress || typeof walletAddress !== "string") return jsonResponse({ error: "Wallet address is required" }, 400);
    if (!redirectUri || typeof redirectUri !== "string") return jsonResponse({ error: "Redirect URI is required" }, 400);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let profile: any = null;

    if (profileId && UUID_RE.test(profileId)) {
      const { data, error } = await supabase
        .from("wallet_profiles")
        .select("id, wallet_address, discord_id")
        .eq("id", profileId)
        .single();
      if (!error && data) profile = data;
    } else {
      const { data, error } = await supabase
        .from("wallet_profiles")
        .select("id, wallet_address, discord_id")
        .ilike("wallet_address", walletAddress)
        .single();
      if (!error && data) {
        profile = data;
      } else {
        const { data: newData, error: insertError } = await supabase
          .from("wallet_profiles")
          .insert({ wallet_address: walletAddress.toLowerCase() })
          .select("id, wallet_address, discord_id")
          .single();
        if (insertError) return jsonResponse({ error: "Failed to create profile" }, 500);
        profile = newData;
      }
    }

    if (!profile) return jsonResponse({ error: "Profile not found" }, 404);
    if (profile.wallet_address.toLowerCase() !== walletAddress.toLowerCase()) return jsonResponse({ error: "Ownership verification failed" }, 403);
    if (profile.discord_id) return jsonResponse({ error: "A Discord account is already linked. Unlink it first." }, 409);

    const tokenResponse = await fetch("https://discord.com/api/v10/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) return jsonResponse({ error: "Failed to exchange Discord authorization code" }, 400);

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const userResponse = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userResponse.ok) return jsonResponse({ error: "Failed to fetch Discord user info" }, 500);

    const discordUser = await userResponse.json();
    const discordId = discordUser.id;
    const discordUsername = discordUser.username;

    const { data: existing } = await supabase
      .from("wallet_profiles")
      .select("id, wallet_address")
      .eq("discord_id", discordId)
      .neq("id", profile.id)
      .maybeSingle();

    if (existing) {
      return jsonResponse({ error: `This Discord account is already linked to wallet ${existing.wallet_address.substring(0,6)}...` }, 409);
    }

    const { error: updateError } = await supabase
      .from("wallet_profiles")
      .update({ discord_id: discordId })
      .eq("id", profile.id);

    if (updateError) return jsonResponse({ error: "Failed to link Discord account" }, 500);

    try {
      await fetch("https://discord.com/api/v10/oauth2/token/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: DISCORD_CLIENT_ID,
          client_secret: DISCORD_CLIENT_SECRET,
          token: accessToken,
        }),
      });
    } catch {}

    return jsonResponse({
      success: true,
      discord_id: discordId,
      discord_username: discordUsername,
    });
  } catch (error) {
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
