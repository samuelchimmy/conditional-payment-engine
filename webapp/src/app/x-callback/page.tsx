"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function XCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Connecting your X account…");

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");
      const error = params.get("error");

      if (error || !code || !state) {
        setStatus("error");
        setMessage(
          error === "access_denied"
            ? "Authorization cancelled."
            : "Missing OAuth parameters."
        );
        setTimeout(() => window.close(), 2000);
        return;
      }

      let profileId: string | undefined;
      let walletAddress: string;
      let codeVerifier: string;

      try {
        const decoded = JSON.parse(atob(state));
        profileId = decoded.profileId;
        walletAddress = decoded.walletAddress;
        codeVerifier = decoded.codeVerifier;
        if (!walletAddress || !codeVerifier) throw new Error("missing walletAddress or codeVerifier");
      } catch (err) {
        console.error(err);
        setStatus("error");
        setMessage("Invalid state parameter.");
        setTimeout(() => window.close(), 2000);
        return;
      }

      try {
        if (!supabase) {
          throw new Error("Supabase client not initialized.");
        }
        
        const response = await supabase.functions.invoke("social-identity", {
          body: {
            action: "link-x-oauth",
            profileId,
            walletAddress,
            code,
            codeVerifier,
            redirectUri: `${window.location.origin}/x-callback`,
          },
        });

        let errMsg = response.data?.error || response.error?.message;
        if (response.error && (response.error as any).context) {
          try {
            const body = await (response.error as any).context.json();
            if (body.error) errMsg = body.error;
          } catch(e) {}
        }

        if (errMsg) {
          if (/already linked/i.test(errMsg) && window.opener && !window.opener.closed) {
            const m = errMsg.match(/@([a-z0-9_]+)/i);
            window.opener.postMessage({
              type: "social-link-conflict",
              platform: "x",
              message: errMsg,
              payTag: m ? m[1] : null,
            }, window.location.origin);
            setTimeout(() => window.close(), 400);
            return;
          }
          throw new Error(errMsg);
        }

        const { x_username, x_user_id } = response.data;

        setStatus("success");
        setMessage(`Connected as @${x_username}!`);

        if (window.opener && !window.opener.closed) {
          const payload = { type: "x-oauth-success", x_username, x_user_id };
          window.opener.postMessage(payload, window.location.origin);
          
          setTimeout(() => {
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage(payload, window.location.origin);
            }
          }, 300);
        }

        setTimeout(() => window.close(), 2000);
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Something went wrong.");
        setTimeout(() => window.close(), 2500);
      }
    };

    run();
  }, []);

  return (
    <div className="w-full max-w-[420px] mx-auto flex flex-col items-center justify-center pt-12 pb-12">
      <div className="flex flex-col items-center gap-4 p-8 text-center w-full">
        {status === "loading" && (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-[#A5A5A3]" />
            <p className="text-[15px] text-[#A5A5A3] font-bold">{message}</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="w-8 h-8 text-[#F2F1EF]" />
            <p className="text-[15px] font-bold text-[#F2F1EF]">{message}</p>
            <p className="text-[13px] text-[#797977] mb-2">You can safely close this window.</p>
            <button
              onClick={() => {
                if (window.opener) {
                  window.close();
                } else {
                  window.location.href = '/link-socials';
                }
              }}
              className="mt-2 h-[48px] px-8 bg-transparent border border-[#2A2A2A] text-[#F2F1EF] rounded-[10px] hover:border-[#3A3A3A] transition-colors font-bold text-[13px]"
            >
              Return to app
            </button>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-8 h-8 text-[#D53131]" />
            <p className="text-[15px] font-bold text-[#D53131]">{message}</p>
            <button
              onClick={() => {
                if (window.opener) {
                  window.close();
                } else {
                  window.location.href = '/link-socials';
                }
              }}
              className="mt-4 h-[48px] px-8 bg-transparent border border-[#2A2A2A] text-[#F2F1EF] rounded-[10px] hover:border-[#3A3A3A] transition-colors font-bold text-[13px]"
            >
              Return to app
            </button>
          </>
        )}
      </div>
    </div>
  );
}
