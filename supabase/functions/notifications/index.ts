import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { sendPushNotification } from "../_shared/onesignal.ts";
import { corsHeaders, verifyRequestSignature } from "../_shared/security.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();
    // In production, we'd verify HMAC signature or require Service Role Auth
    // Since bots call this using SUPABASE_SERVICE_ROLE_KEY, we check that:
    const authHeader = req.headers.get("Authorization");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (authHeader !== `Bearer ${serviceKey}`) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const payload = JSON.parse(bodyText);
    if (!payload.targetWalletAddresses || !payload.title || !payload.message) {
      return new Response("Invalid payload", { status: 400, headers: corsHeaders });
    }

    const result = await sendPushNotification(payload);

    return new Response(JSON.stringify({ success: true, result }), { headers: corsHeaders });
  } catch (error: any) {
    console.error("Notifications Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
