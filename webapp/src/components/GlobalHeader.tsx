"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export function GlobalHeader() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="w-full flex flex-col items-center justify-center pt-10 pb-6 z-50 relative">
      {mounted && (
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="absolute -right-2 top-10 w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </button>
      )}

      <Link href="/" className="flex flex-col items-center gap-2 hover:opacity-90 transition-opacity">
        <img src="/logo.png" alt="tether.arena logo" className="w-16 h-16 object-contain theme-logo-main transition-all duration-300" />
        <div className="flex items-baseline gap-0.5">
          <span className="font-[800] text-text-primary text-[28px] tracking-tight">tether</span>
          <span className="font-[800] text-text-secondary text-[28px]">.</span>
          <span className="font-[400] text-text-primary text-[28px] tracking-tight">arena</span>
        </div>
      </Link>
      <p className="text-text-secondary text-[14px] font-bold mt-1">
        The Conditional Payment Engine
      </p>
    </header>
  );
}
