import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders, checkRateLimit, RATE_LIMITS, getClientIP, rateLimitedResponse } from "../_shared/security.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const X_CLIENT_ID = Deno.env.get("X_CLIENT_ID")!;
const X_CLIENT_SECRET = Deno.env.get("X_CLIENT_SECRET")!;
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

// C5: Google verification — validate ID tokens server-side
const GOOGLE_CLIENT_ID = Deno.env.get("NEXT_PUBLIC_GOOGLE_CLIENT_ID") || Deno.env.get("GOOGLE_CLIENT_ID") || "";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isValidTelegramId(id: string): boolean {
  return /^\d{5,15}$/.test(id);
}

// C5: Verify Google ID token server-side via Google's tokeninfo endpoint
async function verifyGoogleIdToken(idToken: string): Promise<{ email: string; picture?: string } | null> {
  if (!idToken) return null;
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!res.ok) return null;
    const data = await res.json();
    // Validate audience matches our client ID
    if (GOOGLE_CLIENT_ID && data.aud !== GOOGLE_CLIENT_ID) {
      console.warn("[SocialIdentity] Google token audience mismatch:", data.aud);
      return null;
    }
    // Token must not be expired
    if (!data.email || !data.email_verified) return null;
    return { email: data.email, picture: data.picture };
  } catch (e) {
    console.error("[SocialIdentity] Google token verification failed:", e);
    return null;
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function verifyOwnership(supabase: any, profileId: string | undefined, walletAddress?: string) {
  if (!walletAddress) {
    return { error: jsonResponse({ error: "walletAddress is required for this action" }, 400) };
  }
  // Basic Ethereum address format validation
  if (!/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) {
    return { error: jsonResponse({ error: "Invalid wallet address format" }, 400) };
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

// Constant-time string comparison (prevents timing attacks)
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const ip = req.headers.get("cf-connecting-ip") ||
               req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
               "unknown";

    // Apply registration rate limiting (3 per 10 min per IP)
    const rl = await checkRateLimit(ip, RATE_LIMITS.register);
    if (!rl.allowed) return rateLimitedResponse(rl);

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
      let telegramId: string | undefined = body.telegramId;
      let telegramUsername: string | undefined;

      if (widgetPayload && typeof widgetPayload === "object") {
        const { hash: providedHash, ...rest } = widgetPayload;
        if (!providedHash) return jsonResponse({ error: "Missing Telegram widget hash" }, 400);

        const dataCheckString = Object.keys(rest).sort().map((k) => `${k}=${rest[k]}`).join("\n");
        const enc = new TextEncoder();
        const secretKey = await crypto.subtle.digest("SHA-256", enc.encode(TELEGRAM_BOT_TOKEN));
        const hmacKey = await crypto.subtle.importKey("raw", secretKey, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const sig = await crypto.subtle.sign("HMAC", hmacKey, enc.encode(dataCheckString));
        const expectedHash = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");

        // C2 FIX: Use constant-time comparison to prevent timing attacks
        if (!constantTimeEqual(expectedHash, providedHash)) {
          return jsonResponse({ error: "Invalid Telegram signature" }, 401);
        }

        const authDate = parseInt(rest.auth_date || "0", 10);
        if (!authDate || Date.now() / 1000 - authDate > 86400) {
          return jsonResponse({ error: "Telegram auth expired" }, 401);
        }

        // C2 FIX: Declare variables correctly (was ReferenceError)
        telegramId = String(rest.id);
        telegramUsername = rest.username;
      }

      if (!telegramId || !isValidTelegramId(telegramId)) return jsonResponse({ error: "Invalid Telegram ID" }, 400);

      const { data: existingProfile } = await supabase
        .from("wallet_profiles")
        .select("id, wallet_address")
        .eq("telegram_id", telegramId)
        .neq("id", ownershipResult.profile.id)
        .maybeSingle();

      if (existingProfile) {
        return jsonResponse({ error: `This Telegram account is already linked to wallet ${existingProfile.wallet_address.substring(0,6)}...` }, 409);
      }

      const { error: updateErr } = await supabase
        .from("wallet_profiles")
        .update({ telegram_id: telegramId, telegram_username: telegramUsername })
        .eq("id", ownershipResult.profile.id);

      if (updateErr) return jsonResponse({ error: "Failed to link Telegram" }, 500);
      return jsonResponse({ success: true, telegram_id: telegramId });
    }

    if (action === "link-google") {
      // C5 FIX: Require Google ID token and verify it server-side — never trust client-supplied email
      const { googleIdToken, googlePicture } = body;
      if (!googleIdToken) return jsonResponse({ error: "Google ID token is required for verification" }, 400);

      const googleUser = await verifyGoogleIdToken(googleIdToken);
      if (!googleUser) return jsonResponse({ error: "Google identity verification failed. Invalid or expired token." }, 401);

      const googleEmail = googleUser.email;
      const verifiedPicture = googleUser.picture || googlePicture;

      // Verify email isn't already linked to another profile
      const { data: existing } = await supabase
        .from("wallet_profiles")
        .select("id, wallet_address")
        .eq("google_email", googleEmail)
        .neq("id", ownershipResult.profile.id)
        .maybeSingle();

      if (existing) {
        return jsonResponse({ error: `This Google account is already linked to wallet ${existing.wallet_address.substring(0,6)}...` }, 409);
      }

      const { error } = await supabase
        .from("wallet_profiles")
        .update({ google_email: googleEmail, google_picture: verifiedPicture })
        .eq("id", ownershipResult.profile.id);

      if (error) return jsonResponse({ error: "Failed to link Google account" }, 500);
      return jsonResponse({ success: true, google_email: googleEmail });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (error: any) {
    return jsonResponse({ error: error.message }, 500);
  }
});
