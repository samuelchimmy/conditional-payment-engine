import type { Metadata } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import "./globals.css";
import React from "react";
import Link from "next/link";

import { ThemeProvider } from "@/components/ThemeProvider";

const schibsted = Schibsted_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "tether.arena",
  description: "The Conditional Payment Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${schibsted.variable} antialiased`} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen text-text-primary">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {/* Global Nav / Header moved to template/pages */}

          <main className="flex-1 flex flex-col items-center px-4 w-full">
            {children}
          </main>

          {/* Global Footer */}
          <footer className="w-full py-8 mt-auto flex flex-col items-center justify-center border-t border-divider gap-8">
            <div className="flex gap-6 text-[13px] font-medium text-text-muted">
              <Link href="#" className="hover:text-text-primary transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-text-primary transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-text-primary transition-colors">Support</Link>
            </div>

            <div className="flex flex-col items-center gap-3">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-[0.15em]">Powered by</span>
              <div className="flex items-center gap-6 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                <img src="/tether-logo.svg" alt="Tether" className="h-[22px] w-auto" />
                <img src="/wdk-logo.svg" alt="WDK" className="h-[20px] w-auto" />
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
