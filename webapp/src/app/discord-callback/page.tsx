"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function DiscordCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Linking your Discord account...");

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");

      if (!code) {
        setStatus("error");
        setMessage("No authorization code received from Discord.");
        return;
      }

      // Parse state (contains profileId + walletAddress)
      let profileId: string, walletAddress: string;
      try {
        const parsed = JSON.parse(atob(state || ""));
        profileId = parsed.profileId;
        walletAddress = parsed.walletAddress;
      } catch {
        setStatus("error");
        setMessage("Invalid session state. Please try again.");
        return;
      }

      const redirectUri = `${window.location.origin}/discord-callback`;

      try {
        if (!supabase) {
          throw new Error("Supabase client not initialized.");
        }

        const { data, error } = await supabase.functions.invoke("discord-oauth", {
          body: { code, redirectUri, profileId, walletAddress },
        });

        if (error) throw error;
        if (data?.error) {
          setStatus("error");
          setMessage(data.error);
          return;
        }

        setStatus("success");
        setMessage(`Connected as ${data.discord_username}!`);

        // Notify the opener window and close
        if (window.opener) {
          window.opener.postMessage({ type: "discord-oauth-success", ...data }, window.location.origin);
          setTimeout(() => window.close(), 1500);
        }
      } catch (e: any) {
        setStatus("error");
        setMessage(e.message || "Failed to link Discord account.");
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
            <p className="text-[15px] font-bold text-[#F2F1EF]">{message}</p>
            <p className="text-[13px] text-[#797977]">This window will close automatically.</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-[#D53131] mx-auto" />
            <p className="text-[15px] font-bold text-[#D53131]">Linking Failed</p>
            <p className="text-[13px] text-[#A5A5A3]">{message}</p>
            <button onClick={() => window.close()} className="mt-4 h-[52px] px-8 bg-transparent border border-[#2A2A2A] text-[#F2F1EF] rounded-[10px] hover:border-[#3A3A3A] transition-colors">
              Close this window
            </button>
          </>
        )}
      </div>
    </div>
  );
}
