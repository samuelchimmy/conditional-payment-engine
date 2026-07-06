"use client";

import { useEffect, useRef } from "react";
import { useWallet } from "@/hooks/useWallet";

interface TelegramLoginWidgetProps {
  botName: string;
  onAuth: (user: any) => void;
  buttonSize?: "large" | "medium" | "small";
  cornerRadius?: number;
  requestAccess?: string;
  usePic?: boolean;
}

export function TelegramLoginWidget({
  botName,
  onAuth,
  buttonSize = "large",
  cornerRadius = 10,
  requestAccess = "write",
  usePic = true,
}: TelegramLoginWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { profile, address } = useWallet();

  useEffect(() => {
    // Add global callback function for the widget
    (window as any).onTelegramAuth = (user: any) => {
      onAuth(user);
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botName);
    script.setAttribute("data-size", buttonSize);
    script.setAttribute("data-radius", cornerRadius.toString());
    script.setAttribute("data-request-access", requestAccess);
    script.setAttribute("data-userpic", usePic.toString());
    // Use callback instead of redirect for seamless React integration
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.async = true;

    // We pass state (profileId, address) to the API manually via the onAuth callback, 
    // so we don't need a redirect URL here.
    
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(script);
    }

    return () => {
      delete (window as any).onTelegramAuth;
    };
  }, [botName, onAuth, buttonSize, cornerRadius, requestAccess, usePic]);

  return <div ref={containerRef} className="telegram-widget-container flex items-center justify-center"></div>;
}
