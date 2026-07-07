"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { ERC20ABI, USDTAddressCelo, IOURegistryV3Address } from "@/lib/contracts";
import { useWallet } from "@/components/WalletProvider";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-hot-toast";
import { TelegramLoginWidget } from "@/components/TelegramLoginWidget";

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'ru', label: 'Russian' },
  { code: 'de', label: 'German' },
  { code: 'hi', label: 'Hindi' },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const { address, disconnectWallet } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [allowanceAmount, setAllowanceAmount] = useState("50.00");
  const [isAllowanceModalOpen, setIsAllowanceModalOpen] = useState(false);
  const [tempAllowance, setTempAllowance] = useState(allowanceAmount);
  
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);

  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (isOpen && address) {
      setLoadingProfile(true);
      supabase
        .from("wallet_profiles")
        .select("*")
        .eq("wallet_address", address.toLowerCase())
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setProfile(data);
          }
          setLoadingProfile(false);
        });
    }
  }, [isOpen, address]);

  // Social Linking Logic from link-socials
  const [linkingPlatform, setLinkingPlatform] = useState<string | null>(null);

  // Polling for X (Twitter) linking in case the popup gets stuck on mobile
  useEffect(() => {
    if (linkingPlatform === 'twitter' && address) {
      const interval = setInterval(async () => {
        const { data } = await supabase.from('wallet_profiles').select('x_username').eq('wallet_address', address.toLowerCase()).single();
        if (data && data.x_username) {
          setLinkingPlatform(null);
          setProfile((prev: any) => ({ ...prev, x_username: data.x_username }));
          toast.success("Account linked successfully!");
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [linkingPlatform, address]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === "x-oauth-success" || event.data?.type === "discord-oauth-success" || event.data?.type === "telegram-oauth-success") {
        setLinkingPlatform(null);
        // Refresh profile to show connected state
        if (address) {
          const { data } = await supabase.from("wallet_profiles").select("*").eq("wallet_address", address.toLowerCase()).single();
          if (data) setProfile(data);
        }
        toast.success("Account linked successfully!");
      } else if (event.data?.type === "social-link-conflict") {
        toast.error(event.data.message);
        setLinkingPlatform(null);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [address]);

  const handleLink = async (platform: "twitter" | "discord") => {
    setLinkingPlatform(platform);

    let oauthUrl = "";

    if (platform === "discord") {
      const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
      const redirectUri = encodeURIComponent(`${window.location.origin}/discord-callback`);
      const state = btoa(JSON.stringify({ walletAddress: address }));
      oauthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify&state=${state}`;
    } else if (platform === "twitter") {
      const clientId = process.env.NEXT_PUBLIC_X_CLIENT_ID;
      const redirectUri = encodeURIComponent(`${window.location.origin}/x-callback`);
      const state = btoa(JSON.stringify({ walletAddress: address, codeVerifier: "challenge" }));
      oauthUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=tweet.read%20users.read&state=${state}&code_challenge=challenge&code_challenge_method=plain`;
    }

    const width = 500;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(oauthUrl, `Connect ${platform}`, `width=${width},height=${height},left=${left},top=${top}`);
  };

  const handleTelegramAuth = async (user: any) => {
    try {
      setLinkingPlatform("telegram");
      const response = await supabase.functions.invoke("social-identity", {
        body: {
          action: "link-telegram",
          walletAddress: address,
          telegramUser: user
        }
      });
      if (response.error || response.data?.error) {
        toast.error(response.data?.error || response.error?.message || "Failed to link Telegram");
      } else {
        if (address) {
          const { data } = await supabase.from("wallet_profiles").select("*").eq("wallet_address", address.toLowerCase()).single();
          if (data) setProfile(data);
        }
        toast.success("Telegram linked!");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to link Telegram");
    } finally {
      setLinkingPlatform(null);
    }
  };

  const handleDisconnect = async (platform: 'x' | 'discord' | 'telegram') => {
    if (!profile) return;
    const updates: any = {};
    if (platform === 'x') {
      updates.x_username = null;
      updates.x_user_id = null;
      updates.x_verified = false;
    } else if (platform === 'discord') {
      updates.discord_id = null;
    } else if (platform === 'telegram') {
      updates.telegram_id = null;
    }

    const { error } = await supabase
      .from("wallet_profiles")
      .update(updates)
      .eq("id", profile.id);

    if (error) {
      toast.error(`Failed to disconnect ${platform}`);
    } else {
      setProfile({ ...profile, ...updates });
      toast.success(`Disconnected ${platform}`);
    }
  };

  // Wagmi Hooks for Approval
  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isConfirmed) {
      setAllowanceAmount(tempAllowance || "0.00");
      setIsAllowanceModalOpen(false);
      toast.success("Allowance approved successfully!");
    }
  }, [isConfirmed]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to approve allowance");
    }
  }, [error]);

  const handleApprove = () => {
    if (!tempAllowance) return;
    try {
      const amountParsed = parseUnits(tempAllowance, 6);
      writeContract({
        address: USDTAddressCelo,
        abi: ERC20ABI,
        functionName: "approve",
        args: [IOURegistryV3Address, amountParsed],
      });
    } catch (e) {
      console.error("Invalid amount", e);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted) return null;

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: (checked: boolean) => void }) => (
    <div 
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out flex items-center ${checked ? 'bg-text-primary' : 'bg-border'}`}
    >
      <div 
        className={`w-4 h-4 rounded-full bg-surface shadow-md transform transition-transform duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="relative w-full max-w-[480px] bg-surface border border-border rounded-[16px] overflow-hidden flex flex-col shadow-2xl max-h-[90vh]"
          >
            {/* Header */}
            <div className="h-[64px] border-b border-divider flex items-center justify-between px-6 shrink-0">
              <h2 className="text-text-primary text-[16px] font-bold leading-tight">Settings</h2>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-border transition-colors text-text-muted"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex flex-col gap-8">
              
              {/* Backup Info */}
              <div className="flex flex-col gap-2">
                <span className="text-text-secondary text-[11px] uppercase tracking-[0.1em] font-bold mb-1">Backup</span>
                <div className="bg-bg-center border border-border rounded-[10px] p-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-text-primary font-bold text-[13px]">
                      {profile?.google_email ? "Connected via Google" : "No Cloud Backup"}
                    </span>
                    {profile?.google_email && (
                      <span className="text-text-muted text-[12px] mt-0.5">{profile.google_email}</span>
                    )}
                    <span className="text-text-muted text-[11px] mt-2 flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${profile?.google_email ? "bg-[#10B981]" : "bg-text-muted"}`}></div>
                      {profile?.google_email ? "Backed up" : "Not backed up"}
                    </span>
                  </div>
                  <button className="text-text-primary border border-border hover:bg-border px-4 py-2 rounded-[8px] text-[12px] font-bold transition-colors">
                    Manage
                  </button>
                </div>
              </div>

              {/* Connected Socials */}
              <div className="flex flex-col gap-2">
                <span className="text-text-secondary text-[11px] uppercase tracking-[0.1em] font-bold mb-1">Social Accounts</span>
                <div className="bg-bg-center border border-border rounded-[10px] flex flex-col overflow-hidden">
                  
                  {/* Twitter */}
                  <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18.244 2.25H21.552L14.325 10.51L22.827 21.75H16.17L10.956 14.933L4.99 21.75H1.68L9.41 12.915L1.254 2.25H8.08L12.793 8.481L18.244 2.25ZM17.083 19.77H18.916L7.084 4.126H5.117L17.083 19.77Z" fill="currentColor"/>
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-text-primary text-[14px] font-medium">X (Twitter)</span>
                        <span className="text-text-muted text-[12px]">{profile?.x_username ? `@${profile.x_username}` : "Not connected"}</span>
                      </div>
                    </div>
                    {profile?.x_username ? (
                      <button onClick={() => handleDisconnect('x')} className="text-text-secondary border border-border hover:bg-border px-3 py-1.5 rounded-[6px] text-[11px] font-bold transition-colors">
                        Disconnect
                      </button>
                    ) : (
                      <button onClick={() => handleLink('twitter')} disabled={linkingPlatform === 'twitter'} className="text-text-primary border border-border hover:bg-border px-3 py-1.5 rounded-[6px] text-[11px] font-bold transition-colors disabled:opacity-50">
                        {linkingPlatform === 'twitter' ? "Connecting..." : "Connect"}
                      </button>
                    )}
                  </div>

                  {/* Discord */}
                  <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4C14.82 4.33 14.61 4.78 14.46 5.14C12.89 4.91 11.34 4.91 9.8 5.14C9.64 4.78 9.43 4.33 9.25 4C7.75 4.26 6.31 4.71 4.98 5.33C2.31 9.35 1.58 13.27 1.95 17.15C3.73 18.47 5.46 19.26 7.14 19.78C7.55 19.22 7.92 18.63 8.24 18.01C7.63 17.78 7.05 17.5 6.5 17.16C6.65 17.05 6.79 16.93 6.93 16.81C10.23 18.35 13.8 18.35 17.07 16.81C17.21 16.93 17.36 17.05 17.5 17.16C16.95 17.5 16.37 17.78 15.76 18.01C16.08 18.63 16.45 19.22 16.86 19.78C18.54 19.26 20.27 18.47 22.05 17.15C22.48 12.67 21.37 8.84 19.27 5.33ZM8.56 14.28C7.57 14.28 6.76 13.38 6.76 12.28C6.76 11.18 7.55 10.28 8.56 10.28C9.57 10.28 10.38 11.18 10.36 12.28C10.36 13.38 9.57 14.28 8.56 14.28ZM15.68 14.28C14.69 14.28 13.88 13.38 13.88 12.28C13.88 11.18 14.67 10.28 15.68 10.28C16.69 10.28 17.5 11.18 17.48 12.28C17.48 13.38 16.69 14.28 15.68 14.28Z" fill="currentColor"/>
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-text-primary text-[14px] font-medium">Discord</span>
                        <span className="text-text-muted text-[12px]">{profile?.discord_id ? "Connected" : "Not connected"}</span>
                      </div>
                    </div>
                    {profile?.discord_id ? (
                      <button onClick={() => handleDisconnect('discord')} className="text-text-secondary border border-border hover:bg-border px-3 py-1.5 rounded-[6px] text-[11px] font-bold transition-colors">
                        Disconnect
                      </button>
                    ) : (
                      <button onClick={() => handleLink('discord')} disabled={linkingPlatform === 'discord'} className="text-text-primary border border-border hover:bg-border px-3 py-1.5 rounded-[6px] text-[11px] font-bold transition-colors disabled:opacity-50">
                        {linkingPlatform === 'discord' ? "Connecting..." : "Connect"}
                      </button>
                    )}
                  </div>

                  {/* Telegram */}
                  <div className="flex items-center justify-between px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.64 8.8C16.49 10.2 15.82 14.11 15.48 15.91C15.34 16.67 15.06 16.93 14.79 16.96C14.19 17.01 13.73 16.56 13.16 16.19C12.26 15.6 11.75 15.24 10.88 14.67C9.88 14.01 10.53 13.65 11.12 13.04C11.27 12.89 13.88 10.51 13.93 10.3C13.94 10.27 13.94 10.16 13.88 10.1C13.82 10.04 13.73 10.06 13.66 10.08C13.56 10.1 11.96 11.16 8.85 13.26C8.39 13.57 7.98 13.72 7.6 13.71C7.19 13.7 6.4 13.48 5.81 13.28C5.09 13.04 4.51 12.91 4.56 12.51C4.59 12.3 4.8 12.08 5.2 11.85C9.04 10.18 11.6 9.08 12.89 8.54C16.58 7.01 17.35 6.74 17.85 6.73C17.96 6.73 18.21 6.76 18.37 6.89C18.5 7 18.53 7.18 18.55 7.3C18.54 7.4 18.56 7.6 18.55 7.7Z" fill="currentColor"/>
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-text-primary text-[14px] font-medium">Telegram</span>
                        <span className="text-text-muted text-[12px]">{profile?.telegram_id ? "Connected" : "Not connected"}</span>
                      </div>
                    </div>
                    {profile?.telegram_id ? (
                      <button onClick={() => handleDisconnect('telegram')} className="text-text-secondary border border-border hover:bg-border px-3 py-1.5 rounded-[6px] text-[11px] font-bold transition-colors relative z-20">
                        Disconnect
                      </button>
                    ) : (
                      <div className="relative">
                        <button disabled={linkingPlatform === 'telegram'} className="text-text-primary border border-border hover:bg-border px-3 py-1.5 rounded-[6px] text-[11px] font-bold transition-colors disabled:opacity-50">
                          {linkingPlatform === 'telegram' ? "Connecting..." : "Connect"}
                        </button>
                        {!linkingPlatform && (
                          <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 cursor-pointer">
                            <div className="w-full h-full flex items-center justify-center scale-[3] origin-center cursor-pointer">
                              <TelegramLoginWidget
                                botName="TarenaAi_bot"
                                onAuth={handleTelegramAuth}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="flex flex-col gap-2">
                <span className="text-text-secondary text-[11px] uppercase tracking-[0.1em] font-bold mb-1">Preferences</span>
                <div className="bg-bg-center border border-border rounded-[10px] flex flex-col overflow-hidden">
                  
                  <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                    <span className="text-text-primary text-[14px] font-medium">Notifications</span>
                    <ToggleSwitch checked={true} onChange={() => {}} />
                  </div>
                  
                  <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                    <div className="flex flex-col">
                      <span className="text-text-primary text-[14px] font-medium">Payment alerts & updates</span>
                      <span className="text-text-muted text-[12px] mt-0.5">Receive updates when funds move</span>
                    </div>
                    <ToggleSwitch checked={true} onChange={() => {}} />
                  </div>

                  <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                    <span className="text-text-primary text-[14px] font-medium">Sound Effects</span>
                    <ToggleSwitch checked={false} onChange={() => {}} />
                  </div>

                  <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                    <span className="text-text-primary text-[14px] font-medium">Switch to dark theme</span>
                    <ToggleSwitch 
                      checked={theme === 'dark'} 
                      onChange={(checked) => setTheme(checked ? 'dark' : 'light')} 
                    />
                  </div>

                  <div className="flex flex-col px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-text-primary text-[14px] font-medium">Approve tipping</span>
                        <span className="text-text-muted text-[12px] mt-0.5">Approved amount: {allowanceAmount} USDT</span>
                      </div>
                      <button 
                        onClick={() => {
                          setTempAllowance(allowanceAmount);
                          setIsAllowanceModalOpen(true);
                        }}
                        className="px-5 py-2 bg-accent text-accent-text font-bold rounded-[8px] text-[12px] hover:opacity-90 transition-opacity"
                      >
                        Approve
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Language */}
              <div className="flex flex-col gap-2">
                <span className="text-text-secondary text-[11px] uppercase tracking-[0.1em] font-bold mb-1">Language</span>
                <div 
                  onClick={() => setIsLanguageModalOpen(true)}
                  className="bg-bg-center border border-border rounded-[10px] px-4 py-4 flex items-center justify-between cursor-pointer hover:bg-border transition-colors"
                >
                  <span className="text-text-primary text-[14px] font-medium">Select Language</span>
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary text-[14px]">{selectedLanguage.label}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <div className="flex flex-col mb-4 mt-2">
                <button 
                  onClick={async () => {
                    await disconnectWallet();
                    localStorage.removeItem('onboarding_step');
                    onClose();
                  }}
                  className="w-full h-[52px] border border-border hover:border-[#D53131] hover:text-[#D53131] text-text-primary text-[14px] font-bold rounded-[10px] transition-colors"
                >
                  Log out
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}
      
      {/* Allowance Sub-Modal */}
      {isAllowanceModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAllowanceModalOpen(false)}
            className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="relative w-full max-w-[400px] bg-surface border border-border rounded-[16px] overflow-hidden flex flex-col shadow-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-text-primary text-[16px] font-bold">Approve Allowance</h3>
              <button 
                onClick={() => setIsAllowanceModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-border transition-colors text-text-muted"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            
            <div className="flex flex-col gap-4 mb-8">
              <p className="text-text-muted text-[13px]">
                Enter the maximum amount of USDT you want to allow the tipping engine to spend automatically.
              </p>
              <div className="relative w-full">
                <input 
                  type="number" 
                  value={tempAllowance}
                  onChange={(e) => setTempAllowance(e.target.value)}
                  className="w-full h-[52px] bg-bg-center border border-border rounded-[10px] px-4 text-text-primary text-[15px] focus:outline-none focus:border-border-emphasis font-mono"
                  placeholder="0.00"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-[13px] font-mono">
                  USDT
                </span>
              </div>
            </div>
            
            <button 
              onClick={handleApprove}
              disabled={isPending || isConfirming}
              className="w-full h-[52px] bg-accent text-accent-text font-bold rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center"
            >
              {isPending || isConfirming ? (
                <div className="animate-spin h-5 w-5 border-2 border-accent-text border-t-transparent rounded-full" />
              ) : (
                "Confirm Approval"
              )}
            </button>
          </motion.div>
        </div>
      )}

      {/* Language Sub-Modal */}
      {isLanguageModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLanguageModalOpen(false)}
            className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="relative w-full max-w-[400px] bg-surface border border-border rounded-[16px] overflow-hidden flex flex-col shadow-2xl max-h-[80vh]"
          >
            <div className="h-[64px] border-b border-divider flex items-center justify-between px-6 shrink-0">
              <h3 className="text-text-primary text-[16px] font-bold">Select Language</h3>
              <button 
                onClick={() => setIsLanguageModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-border transition-colors text-text-muted"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex flex-col gap-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLanguage(lang);
                    setIsLanguageModalOpen(false);
                  }}
                  className={`w-full h-[52px] px-4 rounded-[10px] flex items-center justify-between transition-colors ${selectedLanguage.code === lang.code ? 'bg-bg-center border border-border-emphasis' : 'hover:bg-border border border-transparent'}`}
                >
                  <span className={`text-[14px] ${selectedLanguage.code === lang.code ? 'text-text-primary font-bold' : 'text-text-secondary font-medium'}`}>
                    {lang.label}
                  </span>
                  {selectedLanguage.code === lang.code && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D53131" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

    </AnimatePresence>
  );
}
