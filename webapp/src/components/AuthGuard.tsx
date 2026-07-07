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
  '/discord-callback', 
  '/telegram-callback'
];

const onboardingPaths = [
  '/place',
  '/link-socials',
  '/deposit'
];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isConnected, isInitialized } = useWallet();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isInitialized) return;

    if (!isConnected && !publicPaths.includes(pathname)) {
      router.push('/');
      return;
    }

    if (isConnected) {
      if (onboardingPaths.includes(pathname) || pathname === '/dashboard') {
        localStorage.setItem('onboarding_step', pathname);
      } else if (pathname === '/') {
        const lastStep = localStorage.getItem('onboarding_step');
        if (lastStep && lastStep !== '/') {
          router.push(lastStep);
        } else {
          router.push('/dashboard');
        }
      }
    }
  }, [isConnected, isInitialized, pathname, router]);

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg-center">
        <div className="w-8 h-8 border-2 border-text-muted border-t-text-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isConnected && !publicPaths.includes(pathname)) {
    return null; // Don't render protected content while redirecting
  }

  return <>{children}</>;
}
