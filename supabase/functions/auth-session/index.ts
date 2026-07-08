import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyMessage } from "https://esm.sh/viem@2";
import { SignJWT } from "https://deno.land/x/jose@v4.14.4/index.ts";
import { corsHeaders } from "../_shared/security.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
// CR-4: never fall back to a committed secret — that would let anyone forge tokens.
const jwtSecret = Deno.env.get("JWT_SECRET");

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!jwtSecret) {
      return new Response(JSON.stringify({ error: "Server auth not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Route: /nonce - Generate a nonce for the wallet
    if (action === "nonce") {
      const { wallet_address } = await req.json();
      if (!wallet_address) {
        return new Response(JSON.stringify({ error: "Missing wallet_address" }), { status: 400, headers: corsHeaders });
      }

      // Generate random alphanumeric nonce
      const nonce = crypto.randomUUID().replace(/-/g, "").substring(0, 16);
      
      // Store in DB, expires in 5 minutes
      const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from("siwe_nonces")
        .upsert({ wallet_address: wallet_address.toLowerCase(), nonce, expires_at });

      if (error) throw error;

      return new Response(JSON.stringify({ nonce }), { headers: corsHeaders });
    }

    // Route: /verify - Verify SIWE signature and issue JWT
    if (action === "verify") {
      const { message, signature, wallet_address } = await req.json();
      
      if (!message || !signature || !wallet_address) {
        return new Response(JSON.stringify({ error: "Missing parameters" }), { status: 400, headers: corsHeaders });
      }

      // 1. Check nonce exists and is not expired
      const { data: nonceRecord, error: nonceErr } = await supabase
        .from("siwe_nonces")
        .select("nonce, expires_at")
        .eq("wallet_address", wallet_address.toLowerCase())
        .single();

      if (nonceErr || !nonceRecord) {
        return new Response(JSON.stringify({ error: "Nonce not found or expired" }), { status: 401, headers: corsHeaders });
      }

      if (new Date(nonceRecord.expires_at).getTime() < Date.now()) {
        return new Response(JSON.stringify({ error: "Nonce expired" }), { status: 401, headers: corsHeaders });
      }

      // Verify the message contains the nonce (simple check, proper SIWE parsing is better but this works)
      if (!message.includes(nonceRecord.nonce)) {
        return new Response(JSON.stringify({ error: "Nonce mismatch in message" }), { status: 401, headers: corsHeaders });
      }

      // 2. Verify Ethereum signature using viem
      const isValid = await verifyMessage({
        address: wallet_address as `0x${string}`,
        message,
        signature: signature as `0x${string}`
      });

      if (!isValid) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401, headers: corsHeaders });
      }

      // 3. Issue JWT session token
      const secret = new TextEncoder().encode(jwtSecret);
      const jwt = await new SignJWT({ 
          wallet_address: wallet_address.toLowerCase(),
          role: "authenticated",
        })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(secret);

      // Clean up used nonce
      await supabase.from("siwe_nonces").delete().eq("wallet_address", wallet_address.toLowerCase());

      // Ensure a wallet profile exists
      await supabase.from("wallet_profiles").upsert(
        { wallet_address: wallet_address.toLowerCase() },
        { onConflict: "wallet_address" }
      );

      return new Response(JSON.stringify({ token: jwt }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 404, headers: corsHeaders });

  } catch (error: any) {
    console.error("Auth Session Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
