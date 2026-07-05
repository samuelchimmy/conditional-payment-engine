"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
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

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Track the scroll position relative to this container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  // Calculate the ball's Y position percentage
  // We use scrollYProgress (0 to 1) and map it to a top % offset
  const ballY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  // Rotate the ball dynamically as it rolls down
  const ballRotate = useTransform(scrollYProgress, [0, 1], [0, 1440]); // 4 full rotations

  return (
    <div className="w-full flex flex-col items-center pt-8 pb-32">
      <div className="mb-24 text-center">
        <h1 className="text-text-primary text-[36px] font-[800] tracking-tight">
          How it works
        </h1>
        <p className="text-text-muted text-[16px] mt-2 max-w-[340px] mx-auto leading-relaxed">
          The lifecycle of a conditional tip, from your mouth to their wallet.
        </p>
      </div>

      {/* The timeline container */}
      <div 
        ref={containerRef} 
        className="relative flex flex-col gap-32 max-w-[500px] w-full items-start pl-8 sm:pl-0 sm:items-center"
      >
        {/* Background Vertical Line */}
        <div className="absolute left-[39px] sm:left-1/2 top-0 bottom-0 w-[2px] bg-border sm:-translate-x-1/2 z-0" />

        {/* The Rolling Ball */}
        <motion.div 
          style={{ top: ballY, rotate: ballRotate }}
          className="absolute left-[28px] sm:left-1/2 sm:-translate-x-1/2 w-6 h-6 z-10 -mt-3"
        >
          {/* We make an orange and black segmented ball to show rotation clearly */}
          <div className="w-full h-full rounded-full bg-accent border-[3px] border-[#050505] overflow-hidden flex shadow-lg">
            <div className="w-1/2 h-full bg-[#000000]"></div>
            <div className="w-1/2 h-full bg-accent"></div>
          </div>
        </motion.div>

        {/* The Steps */}
        {steps.map((step, i) => {
          // Alternate sides for desktop
          const isEven = i % 2 === 0;

          return (
            <div key={i} className={`relative flex w-full justify-start ${isEven ? "sm:justify-end" : "sm:justify-start"} z-20`}>
              <div className={`w-full sm:w-[calc(50%-48px)] flex flex-col pl-16 sm:pl-0 ${isEven ? "sm:text-left" : "sm:text-right"}`}>
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
            </div>
          );
        })}
      </div>

      <div className="mt-32 w-full max-w-[280px]">
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
