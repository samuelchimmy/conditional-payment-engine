import type { Metadata } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import "./globals.css";
import React from "react";
import Link from "next/link";

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
    <html lang="en" className={`${schibsted.variable} antialiased`}>
      <body className="flex flex-col min-h-screen text-text-primary">
        {/* Global Nav / Header moved to template/pages */}

        <main className="flex-1 flex flex-col items-center px-4 w-full">
          {children}
        </main>

        {/* Global Footer */}
        <footer className="w-full py-8 mt-auto flex justify-center border-t border-divider">
          <div className="flex gap-6 text-[13px] font-medium text-text-muted">
            <Link href="#" className="hover:text-text-primary transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-text-primary transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-text-primary transition-colors">Support</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
