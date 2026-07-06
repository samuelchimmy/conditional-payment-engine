"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";

const steps = [
  {
    num: "1",
    title: "Create Wallet",
    desc: "Connect securely. A wallet is instantly created and backed up to your Google Drive. No seed phrases needed."
  },
  {
    num: "2",
    title: "Link Social Accounts",
    desc: "Link your X (Twitter), Discord, or Telegram account so the engine knows who you are when you tip."
  },
  {
    num: "3",
    title: "Deposit",
    desc: "Send USDT directly on Celo or use our built-in cross-chain bridge from Ethereum, Base, Polygon, or Arbitrum."
  },
  {
    num: "4",
    title: "Approve Spending Allowance",
    desc: "Grant the Tether Arena engine permission to move your USDT only when your specific bet conditions are met."
  },
  {
    num: "5",
    title: "Place a Conditional Bet",
    desc: "Talk in plain language on X, Discord, or Telegram. 'Send 15 USDT to @user if Nigeria beats Brazil'. Your funds are locked safely in escrow."
  },
  {
    num: "6",
    title: "Wait for the Match",
    desc: "Tether Arena's oracle monitors multiple independent sports data sources to ensure verified score accuracy."
  },
  {
    num: "7",
    title: "Outcome",
    desc: "If your condition is met, the winner is paid automatically. If not, your funds unlock for immediate 1-tap refund."
  },
  {
    num: "8",
    title: "Claiming",
    desc: "Winners get credited instantly to their tether.arena wallet, winners without a wallet get a mentioned in the thread to claim. They just create a tether.arena wallet, link their social account and the USDT is there to claim securedly."
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

const faqs = [
  {
    question: "What is tether.arena?",
    answer: "tether.arena is a decentralized conditional tipping engine. It allows you to place funds in a smart contract escrow that automatically releases to a designated winner based on real-world events, like sports match outcomes."
  },
  {
    question: "What is a recovery phrase, and why should I care about it?",
    answer: "A recovery phrase is a master key to your non-custodial wallet. Because tether.arena does not hold your funds, you are the sole owner. If you lose access to your device and haven't backed up your recovery phrase (either manually or via cloud backup), your funds will be permanently lost. No one, not even the developers, can recover them for you."
  },
  {
    question: "How do I back up my wallet?",
    answer: "Tether Wallet offers two ways to protect your wallet so you can recover it if you switch phones or lose your device.\n\nOption 1: Cloud Backup (recommended)\nDuring setup, the app will offer to create an encrypted backup. Here is how it works: the app generates a special encryption key on your device, uses it to encrypt your wallet data, then stores the encrypted data on Tether servers and the encryption key in your personal cloud account (e.g., iCloud on iPhone or Google Drive on Android).\n\nThis means no single party can access your wallet alone. Tether only holds encrypted data that is unreadable without your key, and your cloud account only holds the key without the wallet data. Both parts are needed together, and they are only combined on your device when you log in.\n\nTo restore your wallet on a new device, simply log in with your email. The app will automatically retrieve both parts and rebuild your wallet on your device.\n\nOption 2: Manual Backup\nIf you prefer not to use cloud backup, you can write down your 12-word recovery phrase and store it yourself. To restore, you will need to enter all 12 words manually inside the app.\n\nNote: We strongly recommend enabling cloud backup. It provides the same level of security with a much smoother recovery experience. You can always check your backup status or re-run the backup process from Settings."
  },
  {
    question: "How do I send and receive tokens?",
    answer: "You can send and receive tokens directly from the app dashboard. To receive, click the \"Deposit\" button to display your wallet address and QR code. To send or withdraw, simply transfer to any compatible address."
  },
  {
    question: "Are there any fees?",
    answer: "tether.arena does not charge any platform fees for placing or claiming tips. However, you will need to pay standard blockchain network fees (gas) when interacting with the smart contracts. Because the protocol is highly optimized, these fees are typically fractions of a cent."
  },
  {
    question: "What tokens and networks are supported?",
    answer: "Currently, the platform exclusively supports USDT on the Celo network for ultra-fast, low-cost transactions. You can easily bridge USDT from other major networks like Ethereum, Base, Polygon, or Arbitrum directly within the app using our integrated bridge."
  },
  {
    question: "How do I delete my account or get help?",
    answer: "Since tether.arena is a decentralized protocol, there is no central \"account\" to delete. You simply stop using the app and your on-chain wallet remains yours forever. If you need help, you can join our community Discord or Telegram groups to speak with other users and moderators. Please remember that support staff will never ask for your recovery phrase."
  }
];

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="w-full border-b border-divider py-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity"
      >
        <h3 className="text-text-primary text-[15px] font-bold pr-8">{question}</h3>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="text-text-secondary flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </motion.div>
      </button>
      {/* We use framer-motion to animate the height smoothly */}
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="pt-4 text-text-muted text-[13px] leading-relaxed whitespace-pre-wrap">
          {answer}
        </div>
      </motion.div>
    </div>
  );
}

export function HowItWorksSection({ id, onClose }: HowItWorksProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const isAnimating = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // We add +1 step at the end for the "Get Started" CTA reveal
  const maxSteps = steps.length;

  const [isDesktop, setIsDesktop] = useState(true);
  const touchStartY = useRef(0);

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
      if (isDesktop) return;

      if (currentStepIndex === maxSteps && containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        const isScrollingDown = e.deltaY > 0;
        if (scrollTop > 0 || isScrollingDown) {
          return; // Allow native scroll
        }
      }

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

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (isDesktop) return;

      if (currentStepIndex === maxSteps && containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        const currentY = e.touches[0].clientY;
        const isSwipingUp = currentY < touchStartY.current;
        if (scrollTop > 0 || isSwipingUp) {
          return; // Allow native scroll
        }
      }

      e.preventDefault();
      if (isAnimating.current) return;
      
      const currentY = e.touches[0].clientY;
      const delta = touchStartY.current - currentY;

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
    <div 
      id={id} 
      ref={containerRef} 
      className={`w-full flex flex-col items-center relative pt-12 md:pt-32 md:pb-48 ${isDesktop ? 'h-auto overflow-visible' : (currentStepIndex === maxSteps ? 'h-[100dvh] overflow-y-auto' : 'h-[100dvh] overflow-hidden')}`}
    >
      <motion.div 
        animate={isDesktop ? { y: 0 } : { y: -(Math.min(currentStepIndex, maxSteps) * STEP_HEIGHT * 0.85) }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        className="w-full flex flex-col items-center pb-[50vh] md:pb-0"
      >
        <div className="mb-20 text-center px-4">
          <h1 className="text-text-primary text-[32px] font-[800] tracking-tight">
            How it works
          </h1>
          <p className="text-text-muted text-[15px] mt-2 max-w-[340px] mx-auto leading-relaxed">
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
                  <div className="text-text-secondary text-[10px] font-mono tracking-widest uppercase mb-1">
                    Step {step.num}
                  </div>
                  <h3 className="text-text-primary text-[16px] font-[800] leading-tight mb-2">
                    {step.title}
                  </h3>
                  <p className="text-text-muted text-[12px] leading-relaxed">
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
        className="mt-16 w-full max-w-[520px] px-4 flex flex-col items-center pb-24"
      >
        <Link 
          href="/connect" 
          className="w-full max-w-[280px] h-[54px] bg-accent text-accent-text font-bold rounded-[10px] flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg mb-24 mx-auto"
        >
          Get started
        </Link>

        {/* Start Tipping Section */}
        <div className="w-full flex flex-col text-left mt-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          >
            <h2 className="text-text-primary text-[24px] font-[800] tracking-tight mb-4 text-center">
              Start Tipping
            </h2>
            <p className="text-text-muted text-[14px] leading-relaxed mb-8 text-center px-4">
              Ready to put your money where your mouth is? Tweet at @tether.arena, add the bot to your Discord server, or join the Telegram group.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.1 }}
            className="flex flex-col gap-4 w-full max-w-[320px] mb-16 mx-auto"
          >
            <a href="https://x.com/intent/tweet?text=@tetherarena%20pay%20@user%2010%20USDT%20for%20winning%20the%20match" target="_blank" rel="noopener noreferrer" className="w-full h-[54px] bg-surface text-text-primary border border-border font-bold rounded-[10px] flex items-center justify-center hover:bg-border transition-colors">
              Tweet at @tether.arena
            </a>
            <a href="https://discord.com/oauth2/authorize?client_id=1523511863298621531&permissions=8&response_type=code&redirect_uri=https%3A%2F%2Fnngnahfwxhrmejicbkxc.supabase.co%2Fauth%2Fv1%2Fcallback&integration_type=0&scope=identify+bot+guilds.members.read+activities.write+relationships.write+role_connections.write+openid+gateway.connect+identify.premium+guilds+guilds.channels.read+rpc+activities.invites.write" target="_blank" rel="noopener noreferrer" className="w-full h-[54px] bg-surface text-text-primary border border-border font-bold rounded-[10px] flex items-center justify-center hover:bg-border transition-colors">
              Add to a Discord server
            </a>
            <a href="https://t.me/TarenaAi_bot?startgroup=new" target="_blank" rel="noopener noreferrer" className="w-full h-[54px] bg-surface text-text-primary border border-border font-bold rounded-[10px] flex items-center justify-center hover:bg-border transition-colors">
              Add to Telegram group
            </a>
          </motion.div>

          <div className="w-full flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.2 }}
              className="w-full bg-surface border border-border rounded-[10px] p-6"
            >
              <h3 className="text-text-primary text-[15px] font-bold mb-4">Active conditions (Tournaments)</h3>
              <ul className="text-text-muted text-[14px] flex flex-col gap-3 list-disc pl-5">
                <li>World Cup 2026</li>
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.3 }}
              className="w-full bg-surface border border-border rounded-[10px] p-6"
            >
              <h3 className="text-text-primary text-[15px] font-bold mb-4">Command examples</h3>
              <div className="text-text-muted text-[13px] flex flex-col gap-3 font-mono">
                <div className="bg-bg-center p-4 rounded-md border border-border text-text-primary break-words">
                  @tether.arena send 50 USDT to @user if Spain wins the Euro finals
                </div>
                <div className="bg-bg-center p-4 rounded-md border border-border text-text-primary break-words">
                  @tether.arena tip 10 USDT to @user if Alcaraz wins Wimbledon
                </div>
              </div>
            </motion.div>
          </div>

          {/* FAQs Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.4 }}
            className="w-full flex flex-col mt-24 border-t border-divider pt-16"
          >
            <h2 className="text-text-primary text-[24px] font-[800] tracking-tight mb-2">
              Good to know,
            </h2>
            <h2 className="text-text-secondary text-[24px] font-[800] tracking-tight mb-8">
              before you start.
            </h2>
            
            <div className="w-full flex flex-col">
              {faqs.map((faq, index) => (
                <FAQItem key={index} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  </div>
);
}
