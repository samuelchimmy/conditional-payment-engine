"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useWallet } from "@/components/WalletProvider";
import { toast } from "react-hot-toast";
import { TelegramLoginWidget } from "@/components/TelegramLoginWidget";
import { playSuccessSound, playErrorSound } from "@/lib/sounds";

export function SocialLinkingCard() {
  const { address } = useWallet();
  const [linkedStatus, setLinkedStatus] = useState({
    twitter: false,
    discord: false,
    telegram: false,
  });
  
  const [loading, setLoading] = useState<"twitter" | "discord" | "telegram" | null>(null);

  useEffect(() => {
    if (!address) return;
    const fetchStatus = async () => {
      const { data } = await supabase
        .from('wallet_profiles')
        .select('x_username, discord_username, telegram_username')
        .eq('wallet_address', address.toLowerCase())
        .single();
        
      if (data) {
        setLinkedStatus({
          twitter: !!data.x_username,
          discord: !!data.discord_username,
          telegram: !!data.telegram_username
        });
      }
    };
    fetchStatus();
  }, [address]);

  useEffect(() => {
    if (loading === 'twitter' && address) {
      const interval = setInterval(async () => {
        const { data } = await supabase.from('wallet_profiles').select('x_username').eq('wallet_address', address.toLowerCase()).single();
        if (data && data.x_username) {
          setLinkedStatus(prev => ({ ...prev, twitter: true }));
          setLoading(null);
          toast.success("X (Twitter) linked successfully!");
          playSuccessSound();
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading, address]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === "x-oauth-success") {
        setLinkedStatus(prev => ({ ...prev, twitter: true }));
        setLoading(null);
      } else if (event.data?.type === "discord-oauth-success") {
        setLinkedStatus(prev => ({ ...prev, discord: true }));
        setLoading(null);
      } else if (event.data?.type === "telegram-oauth-success") {
        setLinkedStatus(prev => ({ ...prev, telegram: true }));
        setLoading(null);
      } else if (event.data?.type === "social-link-conflict") {
        toast.error(event.data.message);
        playErrorSound();
        setLoading(null);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [address]);

  const handleLink = async (platform: "twitter" | "discord" | "telegram") => {
    if (linkedStatus[platform] || !address) return;
    setLoading(platform);

    let oauthUrl = "";

    if (platform === "discord") {
      const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
      if (!clientId || clientId === "YOUR_DISCORD_CLIENT_ID") {
        setTimeout(() => { setLinkedStatus(prev => ({ ...prev, [platform]: true })); setLoading(null); }, 1000);
        return;
      }
      const redirectUri = encodeURIComponent(`${window.location.origin}/discord-callback`);
      const state = btoa(JSON.stringify({ walletAddress: address }));
      oauthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify&state=${state}`;
    } else if (platform === "twitter") {
      const clientId = process.env.NEXT_PUBLIC_X_CLIENT_ID;
      if (!clientId || clientId === "YOUR_X_CLIENT_ID") {
        setTimeout(() => { setLinkedStatus(prev => ({ ...prev, [platform]: true })); setLoading(null); }, 1000);
        return;
      }
      const redirectUri = encodeURIComponent(`${window.location.origin}/x-callback`);
      const state = btoa(JSON.stringify({ walletAddress: address, codeVerifier: "challenge" }));
      oauthUrl = `https://x.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=tweet.read%20users.read&state=${state}&code_challenge=challenge&code_challenge_method=plain`;
    }

    if (platform !== "telegram") {
      const width = 500;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      window.open(oauthUrl, `Connect ${platform}`, `width=${width},height=${height},left=${left},top=${top}`);
    }
  };

  const handleTelegramAuth = async (user: any) => {
    try {
      setLoading("telegram");
      const widgetPayload = Object.fromEntries(
        Object.entries(user).map(([key, value]) => [key, String(value)])
      );
      const response = await supabase.functions.invoke("social-identity", {
        body: {
          action: "link-telegram",
          walletAddress: address,
          widgetPayload
        }
      });
      if (response.error || response.data?.error) {
        toast.error(response.data?.error || response.error?.message || "Failed to link Telegram");
        playErrorSound();
      } else {
        setLinkedStatus(prev => ({ ...prev, telegram: true }));
        toast.success("Telegram linked!");
        playSuccessSound();
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to link Telegram");
      playErrorSound();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="w-full bg-surface border border-border rounded-[10px] p-5 mb-10 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-text-primary text-[15px] font-bold">Social Accounts</h3>
        <p className="text-text-muted text-[13px]">
          Connect your accounts to send and receive tips via social media.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full">
        {/* Twitter */}
        <div className="flex items-center justify-between p-3 rounded-[8px] bg-bg-center border border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center text-text-primary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.244 2.25H21.552L14.325 10.51L22.827 21.75H16.17L10.956 14.933L4.99 21.75H1.68L9.41 12.915L1.254 2.25H8.08L12.793 8.481L18.244 2.25ZM17.083 19.77H18.916L7.084 4.126H5.117L17.083 19.77Z" fill="currentColor"/>
              </svg>
            </div>
            <span className="text-text-primary text-[14px] font-bold">X (Twitter)</span>
          </div>
          <button
            onClick={() => handleLink("twitter")}
            disabled={loading !== null || linkedStatus.twitter}
            className={`h-[36px] px-5 rounded-[8px] text-[12px] font-bold flex items-center justify-center transition-all duration-300 min-w-[90px]
              ${linkedStatus.twitter 
                ? "bg-success text-[#F2F1EF]" 
                : "bg-accent text-accent-text hover:opacity-90 disabled:opacity-50"}`}
          >
            {loading === "twitter" ? (
              <div className="animate-spin h-3 w-3 border-2 border-accent-text border-t-transparent rounded-full" />
            ) : linkedStatus.twitter ? (
              "Linked ✓"
            ) : (
              "Connect"
            )}
          </button>
        </div>

        {/* Discord */}
        <div className="flex items-center justify-between p-3 rounded-[8px] bg-bg-center border border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center text-text-primary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4C14.82 4.33 14.61 4.78 14.46 5.14C12.89 4.91 11.34 4.91 9.8 5.14C9.64 4.78 9.43 4.33 9.25 4C7.75 4.26 6.31 4.71 4.98 5.33C2.31 9.35 1.58 13.27 1.95 17.15C3.73 18.47 5.46 19.26 7.14 19.78C7.55 19.22 7.92 18.63 8.24 18.01C7.63 17.78 7.05 17.5 6.5 17.16C6.65 17.05 6.79 16.93 6.93 16.81C10.23 18.35 13.8 18.35 17.07 16.81C17.21 16.93 17.36 17.05 17.5 17.16C16.95 17.5 16.37 17.78 15.76 18.01C16.08 18.63 16.45 19.22 16.86 19.78C18.54 19.26 20.27 18.47 22.05 17.15C22.48 12.67 21.37 8.84 19.27 5.33ZM8.56 14.28C7.57 14.28 6.76 13.38 6.76 12.28C6.76 11.18 7.55 10.28 8.56 10.28C9.57 10.28 10.38 11.18 10.36 12.28C10.36 13.38 9.57 14.28 8.56 14.28ZM15.68 14.28C14.69 14.28 13.88 13.38 13.88 12.28C13.88 11.18 14.67 10.28 15.68 10.28C16.69 10.28 17.5 11.18 17.48 12.28C17.48 13.38 16.69 14.28 15.68 14.28Z" fill="currentColor"/>
              </svg>
            </div>
            <span className="text-text-primary text-[14px] font-bold">Discord</span>
          </div>
          <button
            onClick={() => handleLink("discord")}
            disabled={loading !== null || linkedStatus.discord}
            className={`h-[36px] px-5 rounded-[8px] text-[12px] font-bold flex items-center justify-center transition-all duration-300 min-w-[90px]
              ${linkedStatus.discord 
                ? "bg-success text-[#F2F1EF]" 
                : "bg-accent text-accent-text hover:opacity-90 disabled:opacity-50"}`}
          >
            {loading === "discord" ? (
              <div className="animate-spin h-3 w-3 border-2 border-accent-text border-t-transparent rounded-full" />
            ) : linkedStatus.discord ? (
              "Linked ✓"
            ) : (
              "Connect"
            )}
          </button>
        </div>

        {/* Telegram */}
        <div className="relative flex items-center justify-between p-3 rounded-[8px] bg-bg-center border border-border overflow-hidden">
          <div className="flex items-center gap-3 z-10 pointer-events-none">
            <div className="w-8 h-8 flex items-center justify-center text-text-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.64 8.8C16.49 10.2 15.82 14.11 15.48 15.91C15.34 16.67 15.06 16.93 14.79 16.96C14.19 17.01 13.73 16.56 13.16 16.19C12.26 15.6 11.75 15.24 10.88 14.67C9.88 14.01 10.53 13.65 11.12 13.04C11.27 12.89 13.88 10.51 13.93 10.3C13.94 10.27 13.94 10.16 13.88 10.1C13.82 10.04 13.73 10.06 13.66 10.08C13.56 10.1 11.96 11.16 8.85 13.26C8.39 13.57 7.98 13.72 7.6 13.71C7.19 13.7 6.4 13.48 5.81 13.28C5.09 13.04 4.51 12.91 4.56 12.51C4.59 12.3 4.8 12.08 5.2 11.85C9.04 10.18 11.6 9.08 12.89 8.54C16.58 7.01 17.35 6.74 17.85 6.73C17.96 6.73 18.21 6.76 18.37 6.89C18.5 7 18.53 7.18 18.55 7.3C18.54 7.4 18.56 7.6 18.55 7.7Z" fill="currentColor"/>
              </svg>
            </div>
            <span className="text-text-primary text-[14px] font-bold">Telegram</span>
          </div>
          <div className="z-10 pointer-events-none">
            <button
              disabled={loading !== null || linkedStatus.telegram}
              className={`h-[36px] px-5 rounded-[8px] text-[12px] font-bold flex items-center justify-center transition-all duration-300 min-w-[90px]
                ${linkedStatus.telegram 
                  ? "bg-success text-[#F2F1EF]" 
                  : "bg-accent text-accent-text hover:opacity-90 disabled:opacity-50"}`}
            >
              {loading === "telegram" ? (
                <div className="animate-spin h-3 w-3 border-2 border-accent-text border-t-transparent rounded-full" />
              ) : linkedStatus.telegram ? (
                "Linked ✓"
              ) : (
                "Connect"
              )}
            </button>
          </div>
          
          {!linkedStatus.telegram && loading !== "telegram" && (
            <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 cursor-pointer">
              <div className="w-full h-full flex items-center justify-end pr-5 scale-[3] origin-right cursor-pointer">
                <TelegramLoginWidget
                  botName="TarenaAi_bot"
                  onAuth={handleTelegramAuth}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
