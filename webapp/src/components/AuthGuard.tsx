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
  const { isConnected } = useWallet();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
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
  }, [isConnected, pathname, router]);

  if (!isConnected && !publicPaths.includes(pathname)) {
    return null; // Don't render protected content while redirecting
  }

  return <>{children}</>;
}
