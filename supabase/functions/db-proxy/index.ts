import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jwtVerify } from "https://deno.land/x/jose@v4.14.4/index.ts";
import { corsHeaders } from "../_shared/security.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const jwtSecret = Deno.env.get("JWT_SECRET") || "fallback_secret_for_dev";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid Authorization header" }), { status: 401, headers: corsHeaders });
    }

    const token = authHeader.split(" ")[1];
    const secret = new TextEncoder().encode(jwtSecret);
    
    // Verify JWT
    let payload;
    try {
      const result = await jwtVerify(token, secret);
      payload = result.payload;
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JWT token" }), { status: 401, headers: corsHeaders });
    }

    const walletAddress = payload.wallet_address as string;
    if (!walletAddress) {
      return new Response(JSON.stringify({ error: "Token missing wallet_address" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Route: /profile - Get or update the authenticated user's profile
    if (action === "profile") {
      if (req.method === "GET") {
        const { data, error } = await supabase
          .from("wallet_profiles")
          .select("*")
          .eq("wallet_address", walletAddress)
          .single();
        if (error) throw error;
        return new Response(JSON.stringify({ data }), { headers: corsHeaders });
      }
      
      if (req.method === "POST") {
        const body = await req.json();
        // Prevent updating restricted fields directly
        delete body.wallet_address;
        
        const { data, error } = await supabase
          .from("wallet_profiles")
          .update(body)
          .eq("wallet_address", walletAddress)
          .select()
          .single();
        if (error) throw error;
        return new Response(JSON.stringify({ data }), { headers: corsHeaders });
      }
    }

    // Route: /public-profile - Get a specific user's public info safely
    if (action === "public-profile") {
      const targetAddress = url.searchParams.get("address");
      if (!targetAddress) return new Response("Missing address", { status: 400, headers: corsHeaders });
      
      const { data, error } = await supabase
        .from("wallet_profiles")
        .select("wallet_address, x_username, telegram_id, discord_id")
        .eq("wallet_address", targetAddress.toLowerCase())
        .single();
      
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 404, headers: corsHeaders });
      return new Response(JSON.stringify({ data }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 404, headers: corsHeaders });
  } catch (error: any) {
    console.error("DB Proxy Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
