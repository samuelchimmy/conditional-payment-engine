"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const steps = [
  {
    num: "1",
    title: "Create Your Wallet",
    desc: "Connect securely. A wallet is instantly created and backed up to your Google Drive. No seed phrases needed."
  },
  {
    num: "2",
    title: "Deposit USDT",
    desc: "Send USDT directly on Celo or use our built-in cross-chain bridge from Ethereum, Base, Polygon, or Arbitrum."
  },
  {
    num: "3",
    title: "Place a Conditional Bet",
    desc: "Talk in plain language on X, Discord, or Telegram. 'Send 15 USDT to @user if Nigeria beats Brazil'. Your funds are locked safely in escrow."
  },
  {
    num: "4",
    title: "Wait for the Match",
    desc: "Tether Arena's oracle monitors multiple independent sports data sources to ensure verified score accuracy."
  },
  {
    num: "5",
    title: "Outcome",
    desc: "If your condition is met, the winner is paid automatically. If not, your funds unlock for immediate 1-tap refund."
  },
  {
    num: "6",
    title: "Claiming",
    desc: "Winners without a wallet get a DM to claim. They just sign in, their wallet is created, and the USDT is there."
  }
];

// Classic SVG soccer ball icon
const FootballIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-black">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 7l-2.5 3.5h5L12 7z"/>
    <path d="M12 7V2.5"/>
    <path d="M9.5 10.5L4.5 9"/>
    <path d="M14.5 10.5L19.5 9"/>
    <path d="M9.5 10.5l1.5 5.5h2l1.5-5.5"/>
    <path d="M11 16l-3.5 5.5"/>
    <path d="M13 16l3.5 5.5"/>
  </svg>
);

export function HowItWorksSection({ id }: { id?: string }) {
  return (
    <div id={id} className="w-full flex flex-col items-center pt-8 pb-32 overflow-hidden">
      <div className="mb-24 text-center snap-center">
        <h1 className="text-text-primary text-[36px] font-[800] tracking-tight">
          How it works
        </h1>
        <p className="text-text-muted text-[16px] mt-2 max-w-[340px] mx-auto leading-relaxed">
          The lifecycle of a conditional tip, from your mouth to their wallet.
        </p>
      </div>

      <div className="relative flex flex-col max-w-[500px] w-full items-start pl-8 sm:pl-0 sm:items-center">
        {steps.map((step, i) => {
          const isEven = i % 2 === 0;
          const isLast = i === steps.length - 1;

          return (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }} // Strict reveal threshold
              transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
              className="relative flex w-full min-h-[200px] sm:min-h-[240px] justify-start sm:justify-center snap-center z-20"
            >
              {/* Center spine: Ball + Broken Line */}
              <div className="absolute left-[39px] sm:left-1/2 sm:-translate-x-1/2 top-0 bottom-0 flex flex-col items-center">
                {/* The Ball */}
                <div className="w-[34px] h-[34px] rounded-full bg-white flex items-center justify-center z-10 shadow-lg shrink-0 mt-6 sm:mt-12">
                  <FootballIcon />
                </div>
                {/* The connecting line, breaks perfectly before the next step */}
                {!isLast && (
                  <div className="w-[2px] flex-1 bg-border mt-4 mb-4" />
                )}
              </div>

              {/* Step Content */}
              <div className={`w-full sm:w-1/2 flex flex-col mt-6 sm:mt-12 pl-16 sm:pl-0 ${isEven ? "sm:pr-12 sm:text-right self-start sm:-translate-x-full" : "sm:pl-12 sm:text-left self-start"}`}>
                <div className="text-text-secondary text-[11px] font-mono tracking-widest uppercase mb-2">
                  Step {step.num}
                </div>
                <h3 className="text-text-primary text-[20px] font-[800] leading-tight mb-3">
                  {step.title}
                </h3>
                <p className="text-text-muted text-[14px] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-12 w-full max-w-[280px] snap-center">
        <Link 
          href="/connect" 
          className="w-full h-[54px] bg-accent text-accent-text font-bold rounded-[10px] flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg"
        >
          Get started
        </Link>
      </div>
    </div>
  );
}
