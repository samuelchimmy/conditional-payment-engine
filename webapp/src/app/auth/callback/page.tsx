"use client";

import { useEffect } from "react";

export default function AuthCallback() {
  useEffect(() => {
    // This script runs inside the popup window
    if (typeof window !== "undefined" && window.opener) {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const state = urlParams.get("state");
      
      if (code) {
        // Send the code back to the parent window
        window.opener.postMessage(
          { type: "OAUTH_CALLBACK", payload: { code, state } },
          window.location.origin
        );
      } else {
        // Handle error cases or generic callback
        window.opener.postMessage(
          { type: "OAUTH_ERROR", payload: { error: urlParams.get("error") || "No code provided" } },
          window.location.origin
        );
      }

      // Close the popup
      window.close();
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-center text-text-primary">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin h-8 w-8 border-4 border-text-secondary border-t-transparent rounded-full" />
        <p className="text-[14px] text-text-muted">Authenticating...</p>
      </div>
    </div>
  );
}
