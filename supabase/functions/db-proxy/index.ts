import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jwtVerify } from "https://deno.land/x/jose@v4.14.4/index.ts";
import { corsHeaders } from "../_shared/security.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const jwtSecret = Deno.env.get("JWT_SECRET"); // CR-4: no committed fallback secret

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function validateWalletAddress(addr: string | null | undefined): addr is string {
  return typeof addr === "string" && /^0x[0-9a-fA-F]{40}$/.test(addr);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!jwtSecret) return json({ error: "Server auth not configured" }, 500);
    const body = await req.json();
    const { action, walletAddress } = body;

    if (!validateWalletAddress(walletAddress)) {
      return json({ error: "Missing or invalid walletAddress" }, 400);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const walletLower = walletAddress.toLowerCase();

    // ─── AUTHENTICATION ────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return json({ error: "Missing or invalid Authorization header" }, 401);
    }

    try {
      const token = authHeader.split(" ")[1];
      const secret = new TextEncoder().encode(jwtSecret);
      const { payload } = await jwtVerify(token, secret);
      
      if (payload.wallet_address !== walletLower) {
        return json({ error: "Unauthorized: Token does not match wallet address" }, 403);
      }
    } catch (err) {
      return json({ error: "Invalid or expired token" }, 401);
    }

    // ─── GET PROFILE ───────────────────────────────────────────────────────────
    if (action === "get-profile") {
      const { data, error } = await supabase
        .from("wallet_profiles")
        .select("*")
        .ilike("wallet_address", walletLower)
        .maybeSingle();

      if (error) return json({ error: error.message }, 500);

      // Auto-create profile if missing
      if (!data) {
        const { data: created, error: createErr } = await supabase
          .from("wallet_profiles")
          .insert({ wallet_address: walletLower })
          .select("*")
          .single();
        if (createErr) return json({ error: createErr.message }, 500);
        return json({ data: created });
      }

      return json({ data });
    }

    // ─── GET BETS ──────────────────────────────────────────────────────────────
    if (action === "get-bets") {
      // First get profile to find all linked handles
      const { data: profile } = await supabase
        .from("wallet_profiles")
        .select("x_username, telegram_username, discord_id, telegram_id")
        .ilike("wallet_address", walletLower)
        .maybeSingle();

      const orQueries = [
        `sender_id.eq.${walletAddress}`,
        `recipient_handle.eq.${walletAddress}`,
        `sender_id.ilike.${walletLower}`,
        `recipient_handle.ilike.${walletLower}`,
      ];
      const userHandles: string[] = [walletAddress, walletLower];

      if (profile) {
        if (profile.x_username) {
          orQueries.push(`sender_id.eq.${profile.x_username}`);
          orQueries.push(`recipient_handle.eq.${profile.x_username}`);
          orQueries.push(`sender_id.eq.@${profile.x_username}`);
          orQueries.push(`recipient_handle.eq.@${profile.x_username}`);
          userHandles.push(profile.x_username, `@${profile.x_username}`);
        }
        if (profile.telegram_username) {
          orQueries.push(`sender_id.eq.${profile.telegram_username}`);
          orQueries.push(`recipient_handle.eq.${profile.telegram_username}`);
          orQueries.push(`sender_id.eq.@${profile.telegram_username}`);
          orQueries.push(`recipient_handle.eq.@${profile.telegram_username}`);
          userHandles.push(profile.telegram_username, `@${profile.telegram_username}`);
        }
        if (profile.discord_id) {
          orQueries.push(`sender_id.eq.${profile.discord_id}`);
          orQueries.push(`recipient_handle.eq.${profile.discord_id}`);
          userHandles.push(profile.discord_id);
        }
      }

      const { data, error } = await supabase
        .from("conditional_payments")
        .select("*")
        .or(orQueries.join(","))
        .order("created_at", { ascending: false });

      if (error) return json({ error: error.message }, 500);

      // Decorate with isRecipient flag
      const decorated = (data || []).map((b: any) => ({
        ...b,
        isRecipient: userHandles.some(h => h.toLowerCase() === (b.recipient_handle || "").toLowerCase()),
      }));

      return json({ data: decorated, userHandles });
    }

    // ─── INSERT PAYMENT ────────────────────────────────────────────────────────
    if (action === "insert-payment") {
      const { payment } = body;
      if (!payment) return json({ error: "Missing payment data" }, 400);

      // Enforce sender_id always equals the authenticated wallet
      payment.sender_id = walletAddress;
      // Disallow injecting status other than pending
      payment.status = "pending";

      // Required fields check
      const required = ["iou_id", "platform", "recipient_handle", "amount", "currency", "condition_str"];
      for (const field of required) {
        if (!payment[field]) return json({ error: `Missing required field: ${field}` }, 400);
      }

      // Amount cap: $10,000 max
      if (parseFloat(payment.amount) > 10000) {
        return json({ error: "Amount exceeds maximum allowed ($10,000)" }, 400);
      }

      const { data, error } = await supabase
        .from("conditional_payments")
        .insert(payment)
        .select()
        .single();

      if (error) return json({ error: error.message }, 500);
      return json({ data });
    }

    // ─── UPDATE PROFILE PREFERENCES ────────────────────────────────────────────
    if (action === "update-preferences") {
      const { preferences } = body;
      if (!preferences) return json({ error: "Missing preferences" }, 400);

      // Only allow safe fields
      const allowed = ["notifications_enabled", "payment_alerts_enabled", "sound_enabled", "language"];
      const updates: Record<string, any> = {};
      for (const key of allowed) {
        if (key in preferences) updates[key] = preferences[key];
      }

      if (Object.keys(updates).length === 0) return json({ error: "No valid fields to update" }, 400);

      const { data, error } = await supabase
        .from("wallet_profiles")
        .update(updates)
        .ilike("wallet_address", walletLower)
        .select()
        .single();

      if (error) return json({ error: error.message }, 500);
      return json({ data });
    }

    return json({ error: "Unknown action" }, 404);
  } catch (err: any) {
    console.error("[db-proxy] Error:", err);
    return json({ error: err.message || "Internal server error" }, 500);
  }
});
