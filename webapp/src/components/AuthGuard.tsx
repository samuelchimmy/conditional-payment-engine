"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";

const publicPaths = [
  '/', 
  '/connect', 
  '/restore', 
  '/backup-seed', 
  '/terms', 
  '/privacy', 
  '/support', 
  '/x-callback', 
  '/discord-callback', 
  '/telegram-callback'
];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isConnected } = useWallet();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isConnected && !publicPaths.includes(pathname)) {
      router.push('/');
    }
  }, [isConnected, pathname, router]);

  if (!isConnected && !publicPaths.includes(pathname)) {
    return null; // Don't render protected content while redirecting
  }

  return <>{children}</>;
}
