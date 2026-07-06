"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

async function getFunctionErrorMessage(error: unknown): Promise<string> {
  const fallback = (error as any)?.message || "Failed to link Telegram account. Please try again.";
  const context = (error as any)?.context;
  if (context && typeof context.clone === "function") {
    try {
      const body = await context.clone().json();
      return body?.error || fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export default function TelegramCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Linking your Telegram account...");

  useEffect(() => {
    const run = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const stateParam = searchParams.get("state");
      const id = searchParams.get("id");
      const hash = searchParams.get("hash");
      const auth_date = searchParams.get("auth_date");

      if (!stateParam || !id || !hash || !auth_date) {
        setStatus("error");
        setMessage("Missing Telegram authorization parameters.");
        return;
      }

      let profileId: string;
      let walletAddress: string;
      try {
        const parsed = JSON.parse(atob(stateParam));
        profileId = parsed.profileId;
        walletAddress = parsed.walletAddress;
        if (!profileId || !walletAddress) throw new Error("Missing fields");
      } catch {
        setStatus("error");
        setMessage("Invalid session state. Please close this tab and try again.");
        return;
      }

      // Forward the entire widget payload to the edge function for HMAC verification.
      const widgetPayload: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        if (key !== "state") widgetPayload[key] = value;
      });

      try {
        if (!supabase) {
          throw new Error("Supabase client not initialized.");
        }

        const { data, error } = await supabase.functions.invoke("social-identity", {
          body: {
            action: "link-telegram",
            profileId,
            walletAddress,
            widgetPayload,
          },
        });

        if (error) throw new Error(await getFunctionErrorMessage(error));
        if (data?.error) {
          if (/already linked/i.test(data.error) && window.opener && !window.opener.closed) {
            const m = data.error.match(/@([a-z0-9_]+)/i);
            window.opener.postMessage({
              type: "social-link-conflict",
              platform: "telegram",
              message: data.error,
              payTag: m ? m[1] : null,
            }, window.location.origin);
            setTimeout(() => window.close(), 400);
            return;
          }
          setStatus("error");
          setMessage(data.error);
          return;
        }

        setStatus("success");
        setMessage(`Connected as @${data.telegram_username || data.telegram_id}!`);

        if (window.opener) {
          window.opener.postMessage(
            {
              type: "telegram-oauth-success",
              telegram_id: data.telegram_id,
              telegram_username: data.telegram_username,
            },
            window.location.origin,
          );
          setTimeout(() => window.close(), 1500);
        }
      } catch (e: any) {
        setStatus("error");
        setMessage(e.message || "Failed to link Telegram account. Please try again.");
      }
    };

    run();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-sm">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-[#F2F1EF] mx-auto" />
            <p className="text-[15px] font-bold text-[#F2F1EF]">{message}</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-[#F2F1EF] mx-auto" />
            <p className="text-[15px] font-bold text-[#F2F1EF]">Telegram Linked!</p>
            <p className="text-[13px] text-[#A5A5A3]">{message}</p>
            <p className="text-[13px] text-[#797977]">This window will close automatically.</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-[#D53131] mx-auto" />
            <p className="text-[15px] font-bold text-[#D53131]">Linking Failed</p>
            <p className="text-[13px] text-[#A5A5A3]">{message}</p>
            <button
              onClick={() => window.close()}
              className="mt-4 h-[52px] px-8 bg-transparent border border-[#2A2A2A] text-[#F2F1EF] rounded-[10px] hover:border-[#3A3A3A] transition-colors"
            >
              Close this window
            </button>
          </>
        )}
      </div>
    </div>
  );
}
