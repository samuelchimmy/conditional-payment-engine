"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { AnimatePresence, motion } from "framer-motion";
import { GlobalHeader } from "@/components/GlobalHeader";

export default function Home() {
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full flex-1 flex flex-col items-center">
      {/* Centered Hero Container */}
      <div 
        ref={heroRef}
        className="w-full flex-1 flex flex-col items-center justify-center snap-center py-12"
      >
        {/* Render GlobalHeader inline here so it centers dynamically with the hero text */}
        <div className="mb-10">
          <GlobalHeader />
        </div>

        <div className="w-full max-w-[520px] flex flex-col items-center text-center px-4">
          <p className="text-text-secondary font-bold text-[14px] uppercase tracking-[0.08em] mb-4">
            Banter, backed by escrow.
          </p>

          <h1 className="text-text-primary text-[36px] font-[800] leading-[1.1] tracking-tight mb-6">
            Put Your Money<br />Where Your Mouth Is.
          </h1>

          <p className="text-text-muted text-[16px] font-medium leading-[1.6] max-w-[520px] mb-12">
            AI powered conditional tipping engine. Tweet a tip at any username based on match outcomes. Talk in plain language, and the money moves automatically when the match settles. Available on Discord and Telegram.
          </p>

          <div className="w-full max-w-[280px] flex flex-col gap-4">
            <Link 
              href="/connect" 
              className="w-full h-[54px] bg-accent text-accent-text font-bold rounded-[10px] flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              Get started
            </Link>
            {/* Scroll down to #how-it-works on click */}
            <button 
              onClick={() => {
                setShowHowItWorks(true);
                // Allow state to update and render before scrolling
                setTimeout(() => {
                  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
              className="w-full h-[54px] bg-transparent text-text-primary border border-border rounded-[10px] flex items-center justify-center hover:bg-surface transition-colors"
            >
              How it works
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showHowItWorks && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full overflow-hidden flex flex-col items-center"
          >
            <HowItWorksSection id="how-it-works" onClose={() => {
              setShowHowItWorks(false);
              // scroll back up slightly so the user sees they are back in normal land
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
