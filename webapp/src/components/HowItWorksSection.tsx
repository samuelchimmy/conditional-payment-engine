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

export function HowItWorksSection({ id }: { id?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Track the scroll position relative to this container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  const ballY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const ballRotate = useTransform(scrollYProgress, [0, 1], [0, 1440]);

  return (
    <div id={id} className="w-full flex flex-col items-center pt-8 pb-32">
      <div className="mb-24 text-center snap-center">
        <h1 className="text-text-primary text-[36px] font-[800] tracking-tight">
          How it works
        </h1>
        <p className="text-text-muted text-[16px] mt-2 max-w-[340px] mx-auto leading-relaxed">
          The lifecycle of a conditional tip, from your mouth to their wallet.
        </p>
      </div>

      <div 
        ref={containerRef} 
        className="relative flex flex-col gap-[20vh] max-w-[500px] w-full items-start pl-8 sm:pl-0 sm:items-center pb-20"
      >
        <div className="absolute left-[39px] sm:left-1/2 top-0 bottom-0 w-[2px] bg-border sm:-translate-x-1/2 z-0" />

        <motion.div 
          style={{ top: ballY, rotate: ballRotate }}
          className="absolute left-[28px] sm:left-1/2 sm:-translate-x-1/2 w-7 h-7 z-10 -mt-3.5"
        >
          <div 
            className="w-full h-full rounded-full border-[2px] border-[#000] overflow-hidden flex shadow-lg relative bg-accent"
            style={{
              backgroundImage: `repeating-conic-gradient(from 0deg, transparent 0deg 45deg, rgba(0,0,0,0.85) 45deg 90deg)`,
              backgroundSize: '100% 100%'
            }}
          >
            <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 bg-black rounded-full" />
          </div>
        </motion.div>

        {steps.map((step, i) => {
          const isEven = i % 2 === 0;

          return (
            <div key={i} className={`relative flex w-full justify-start ${isEven ? "sm:justify-end" : "sm:justify-start"} z-20 snap-center py-10`}>
              {/* Tightened the viewport amount so it only reveals exactly when it reaches the center */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                className={`w-full sm:w-[calc(50%-48px)] flex flex-col pl-16 sm:pl-0 ${isEven ? "sm:text-left" : "sm:text-right"}`}
              >
                <div className="text-text-secondary text-[11px] font-mono tracking-widest uppercase mb-2">
                  Step {step.num}
                </div>
                <h3 className="text-text-primary text-[20px] font-[800] leading-tight mb-3">
                  {step.title}
                </h3>
                <p className="text-text-muted text-[14px] leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            </div>
          );
        })}
      </div>

      <div className="mt-20 w-full max-w-[280px] snap-center">
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
