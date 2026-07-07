import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from "../_shared/security.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const X_CLIENT_ID = Deno.env.get("X_CLIENT_ID")!;
const X_CLIENT_SECRET = Deno.env.get("X_CLIENT_SECRET")!;
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isValidTelegramId(id: string): boolean {
  return /^\d{5,15}$/.test(id);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function verifyOwnership(supabase: any, profileId: string | undefined, walletAddress?: string) {
  if (!walletAddress) {
    return { error: jsonResponse({ error: "walletAddress is required for this action" }, 400) };
  }
  
  let profile: any = null;

  if (profileId && UUID_RE.test(profileId)) {
    const { data, error } = await supabase
      .from("wallet_profiles")
      .select("id, wallet_address")
      .eq("id", profileId)
      .single();
    if (!error && data) profile = data;
  } else {
    const { data, error } = await supabase
      .from("wallet_profiles")
      .select("id, wallet_address")
      .ilike("wallet_address", walletAddress)
      .single();
    if (!error && data) {
      profile = data;
    } else {
      const { data: newData, error: insertError } = await supabase
        .from("wallet_profiles")
        .insert({ wallet_address: walletAddress.toLowerCase() })
        .select("id, wallet_address")
        .single();
      if (insertError) return { error: jsonResponse({ error: "Failed to create profile" }, 500) };
      profile = newData;
    }
  }

  if (!profile) {
    return { error: jsonResponse({ error: "Profile not found" }, 404) };
  }

  const profileWallet = profile.wallet_address as string;
  if (profileWallet.toLowerCase() !== walletAddress.toLowerCase()) {
    return { error: jsonResponse({ error: "Ownership verification failed" }, 403) };
  }

  return { profile };
}

async function exchangeXOAuthCode(code: string, codeVerifier: string, redirectUri: string) {
  const tokenParams = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
    client_id: X_CLIENT_ID,
  });

  const credentials = btoa(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`);

  const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: tokenParams.toString(),
  });

  if (!tokenRes.ok) {
    throw new Error("Failed to exchange X authorization code");
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  if (!accessToken) throw new Error("No access token returned from X");

  const userRes = await fetch("https://api.twitter.com/2/users/me?user.fields=username", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userRes.ok) throw new Error("Failed to fetch X user info");

  const userData = await userRes.json();
  const x_user_id = userData?.data?.id;
  const x_username = userData?.data?.username;

  if (!x_user_id || !x_username) throw new Error("Invalid user data returned from X");
  return { x_user_id, x_username };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action, profileId, walletAddress } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "get") {
      const { data, error } = await supabase
        .from("wallet_profiles")
        .select("x_username, x_user_id, x_verified, discord_id, telegram_id")
        .eq("id", profileId)
        .single();
      if (error) return jsonResponse({ error: "Failed to fetch profile" }, 500);
      return jsonResponse(data);
    }

    const ownershipResult = await verifyOwnership(supabase, profileId, walletAddress);
    if ("error" in ownershipResult) return ownershipResult.error;

    if (action === "link-x-oauth") {
      const { code, codeVerifier, redirectUri } = body;
      if (!code || !codeVerifier || !redirectUri) return jsonResponse({ error: "Missing parameters" }, 400);

      let x_user_id, x_username;
      try {
        ({ x_user_id, x_username } = await exchangeXOAuthCode(code, codeVerifier, redirectUri));
      } catch (err: any) {
        return jsonResponse({ error: err.message }, 502);
      }

      const { data: existingProfile } = await supabase
        .from("wallet_profiles")
        .select("id, wallet_address")
        .eq("x_user_id", x_user_id)
        .neq("id", ownershipResult.profile.id)
        .maybeSingle();

      if (existingProfile) {
        return jsonResponse({ error: `This X account is already linked to wallet ${existingProfile.wallet_address.substring(0,6)}...` }, 409);
      }

      const { error: updateErr } = await supabase
        .from("wallet_profiles")
        .update({ x_user_id, x_username, x_verified: true })
        .eq("id", ownershipResult.profile.id);

      if (updateErr) return jsonResponse({ error: "Failed to link X account" }, 500);
      return jsonResponse({ success: true, x_username, x_user_id });
    }

    if (action === "link-telegram") {
      const { widgetPayload } = body;
      let telegramId = body.telegramId;

      if (widgetPayload && typeof widgetPayload === "object") {
        const { hash: providedHash, ...rest } = widgetPayload;
        if (!providedHash) return jsonResponse({ error: "Missing Telegram widget hash" }, 400);

        const dataCheckString = Object.keys(rest).sort().map((k) => `${k}=${rest[k]}`).join("\n");
        const enc = new TextEncoder();
        const secretKey = await crypto.subtle.digest("SHA-256", enc.encode(TELEGRAM_BOT_TOKEN));
        const hmacKey = await crypto.subtle.importKey("raw", secretKey, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const sig = await crypto.subtle.sign("HMAC", hmacKey, enc.encode(dataCheckString));
        const expectedHash = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");

        if (expectedHash !== providedHash) return jsonResponse({ error: "Invalid Telegram signature" }, 401);

        const authDate = parseInt(rest.auth_date || "0", 10);
        if (!authDate || Date.now() / 1000 - authDate > 86400) {
          return jsonResponse({ error: "Telegram auth expired" }, 401);
        }

        telegram_user_id = String(rest.id);
        telegram_username = rest.username;
      }

      if (!telegram_user_id || !isValidTelegramId(telegram_user_id)) return jsonResponse({ error: "Invalid Telegram ID" }, 400);

      const { data: existingProfile } = await supabase
        .from("wallet_profiles")
        .select("id, wallet_address")
        .eq("telegram_id", telegram_user_id)
        .neq("id", ownershipResult.profile.id)
        .maybeSingle();

      if (existingProfile) {
        return jsonResponse({ error: `This Telegram account is already linked to wallet ${existingProfile.wallet_address.substring(0,6)}...` }, 409);
      }

      const { error: updateErr } = await supabase
        .from("wallet_profiles")
        .update({ telegram_id: telegram_user_id, telegram_username: telegram_username })
        .eq("id", ownershipResult.profile.id);

      if (updateErr) return jsonResponse({ error: "Failed to link Telegram" }, 500);
      return jsonResponse({ success: true, telegram_id: telegram_user_id });
    }

    if (action === "link-google") {
      const { googleEmail, googlePicture } = body;
      if (!googleEmail) return jsonResponse({ error: "Google email is required" }, 400);

      // Verify email isn't already linked to another profile
      const { data: existing } = await supabase
        .from("wallet_profiles")
        .select("id, wallet_address")
        .eq("google_email", googleEmail)
        .neq("id", profileId)
        .maybeSingle();

      if (existing) {
        return jsonResponse({ error: `This Google account is already linked to wallet ${existing.wallet_address.substring(0,6)}...` }, 409);
      }

      const { error } = await supabase
        .from("wallet_profiles")
        .update({ google_email: googleEmail, google_picture: googlePicture })
        .eq("id", profileId);

      if (error) return jsonResponse({ error: "Failed to link Google account" }, 500);
      return jsonResponse({ success: true, google_email: googleEmail });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (error: any) {
    return jsonResponse({ error: error.message }, 500);
  }
});
