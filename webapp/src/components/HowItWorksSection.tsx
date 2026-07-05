"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";

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

// We use the uploaded football SVG instead of the inline drawing
const FootballIcon = () => (
  <img src="/football.svg" alt="Football" className="w-[34px] h-[34px]" />
);

interface HowItWorksProps {
  id?: string;
  onClose?: () => void;
}

export function HowItWorksSection({ id, onClose }: HowItWorksProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const isAnimating = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // We add +1 step at the end for the "Get Started" CTA reveal
  const maxSteps = steps.length;

  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  // Height of each step block for absolute positioning math
  const STEP_HEIGHT = 160;

  const ballYDesktop = useTransform(scrollYProgress, [0, 1], [0, (steps.length - 1) * STEP_HEIGHT]);
  const ballRotateDesktop = useTransform(scrollYProgress, [0, 1], [0, 360 * (steps.length - 1)]);

  useEffect(() => {
    if (isDesktop) return; // Disable scroll locking entirely on PC

    let accumulatedDeltaY = 0;

    // Intercept scroll
    const handleWheel = (e: WheelEvent) => {
      // If we've released the lock at the bottom, and they are scrolling down, let them go.
      if (currentStepIndex >= maxSteps && e.deltaY > 0) return;
      
      // Otherwise, prevent default scroll
      e.preventDefault();

      if (isAnimating.current) {
        accumulatedDeltaY = 0;
        return;
      }

      accumulatedDeltaY += e.deltaY;

      if (accumulatedDeltaY > 50) {
        // Scroll Down -> Advance step
        if (currentStepIndex < maxSteps) {
          isAnimating.current = true;
          setCurrentStepIndex(prev => prev + 1);
          setTimeout(() => { isAnimating.current = false; accumulatedDeltaY = 0; }, 800);
        }
      } else if (accumulatedDeltaY < -50) {
        // Scroll Up -> Reverse step or exit
        if (currentStepIndex > 0) {
          isAnimating.current = true;
          setCurrentStepIndex(prev => prev - 1);
          setTimeout(() => { isAnimating.current = false; accumulatedDeltaY = 0; }, 800);
        } else if (currentStepIndex === 0) {
          // Exit up
          if (onClose) {
            isAnimating.current = true;
            onClose();
          }
        }
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (currentStepIndex >= maxSteps && touchStartY > e.touches[0].clientY) return;
      e.preventDefault();

      if (isAnimating.current) return;
      const touchEndY = e.touches[0].clientY;
      const delta = touchStartY - touchEndY;

      if (delta > 30) {
        // Swipe up (scroll down)
        if (currentStepIndex < maxSteps) {
          isAnimating.current = true;
          setCurrentStepIndex(prev => prev + 1);
          setTimeout(() => { isAnimating.current = false; }, 800);
        }
      } else if (delta < -30) {
        // Swipe down (scroll up)
        if (currentStepIndex > 0) {
          isAnimating.current = true;
          setCurrentStepIndex(prev => prev - 1);
          setTimeout(() => { isAnimating.current = false; }, 800);
        } else if (currentStepIndex === 0 && onClose) {
          isAnimating.current = true;
          onClose();
        }
      }
    };

    // Attach passive: false to allow e.preventDefault()
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [currentStepIndex, maxSteps, onClose, isDesktop]);

  return (
    <div id={id} ref={containerRef} className="w-full h-[100dvh] md:h-auto overflow-hidden md:overflow-visible flex flex-col items-center relative pt-12 md:pt-32 md:pb-48">
      <motion.div 
        animate={isDesktop ? { y: 0 } : { y: -(Math.min(currentStepIndex, maxSteps) * STEP_HEIGHT * 0.85) }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        className="w-full flex flex-col items-center pb-[50vh] md:pb-0"
      >
        <div className="mb-20 text-center px-4">
          <h1 className="text-text-primary text-[36px] font-[800] tracking-tight">
            How it works
          </h1>
          <p className="text-text-muted text-[16px] mt-2 max-w-[340px] mx-auto leading-relaxed">
            The lifecycle of a conditional tip, from your mouth to their wallet.
          </p>
        </div>

      <div className="relative flex flex-col max-w-[500px] w-full pl-12 sm:pl-0 sm:items-center">
        
        {/* The Continuous Background Line */}
        <div 
          className="absolute left-[39px] sm:left-1/2 sm:-translate-x-1/2 top-[17px] bg-border w-[2px]"
          style={{ height: `${(steps.length - 1) * STEP_HEIGHT}px` }}
        />

        {/* The Single Procedural Ball */}
        <motion.div
          style={isDesktop ? { y: ballYDesktop, rotate: ballRotateDesktop } : undefined}
          animate={!isDesktop ? {
            y: Math.min(currentStepIndex, steps.length - 1) * STEP_HEIGHT,
            rotate: currentStepIndex * 360 // Physical roll rotation
          } : undefined}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          className="absolute left-[22px] sm:left-1/2 sm:-translate-x-1/2 top-0 z-20"
        >
          {/* No background circle, just the pure SVG */}
          <FootballIcon />
        </motion.div>

        {/* The Discrete Steps */}
        <div className="relative w-full">
          {steps.map((step, i) => {
            const isEven = i % 2 === 0;
            // On mobile, ONLY the exact active step is visible (procedurally cleans up previous steps)
            const isVisible = isDesktop ? true : currentStepIndex === i;

            return (
              <div 
                key={i}
                style={{ height: `${STEP_HEIGHT}px` }}
                className="w-full flex relative"
              >
                <motion.div 
                  initial={isDesktop ? { opacity: 0, y: 20 } : { opacity: 0, y: 20 }}
                  whileInView={isDesktop ? { opacity: 1, y: 0 } : undefined}
                  viewport={isDesktop ? { once: true, margin: "-100px" } : undefined}
                  animate={!isDesktop ? { 
                    opacity: isVisible ? 1 : 0, 
                    y: isVisible ? 0 : (currentStepIndex > i ? -20 : 20) 
                  } : undefined}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={`w-full sm:w-1/2 flex flex-col pl-10 sm:pl-0 ${isEven ? "sm:pr-12 sm:text-right sm:-translate-x-full" : "sm:pl-12 sm:text-left sm:translate-x-full"}`}
                >
                  <div className="text-text-secondary text-[11px] font-mono tracking-widest uppercase mb-1">
                    Step {step.num}
                  </div>
                  <h3 className="text-text-primary text-[18px] font-[800] leading-tight mb-2">
                    {step.title}
                  </h3>
                  <p className="text-text-muted text-[13px] leading-relaxed">
                    {step.desc}
                  </p>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      <motion.div 
        initial={isDesktop ? { opacity: 0, y: 20 } : { opacity: 0, y: 20 }}
        whileInView={isDesktop ? { opacity: 1, y: 0 } : undefined}
        viewport={isDesktop ? { once: true, margin: "-50px" } : undefined}
        animate={!isDesktop ? { 
          opacity: currentStepIndex === maxSteps ? 1 : 0,
          y: currentStepIndex === maxSteps ? 0 : 20
        } : undefined}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mt-16 w-full max-w-[280px]"
      >
        <Link 
          href="/connect" 
          className="w-full h-[54px] bg-accent text-accent-text font-bold rounded-[10px] flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg"
        >
          Get started
        </Link>
      </motion.div>
    </motion.div>
  </div>
);
}
