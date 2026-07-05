import Link from "next/link";
import { HowItWorksSection } from "@/components/HowItWorksSection";

export default function Home() {
  return (
    <div className="w-full flex flex-col items-center mt-10">
      <div className="w-full max-w-[520px] flex flex-col items-center text-center">
        {/* Hero Content */}
        <div className="flex flex-col items-center">
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
            <a 
              href="#how-it-works" 
              className="w-full h-[54px] bg-transparent text-text-primary border border-border rounded-[10px] flex items-center justify-center hover:bg-surface transition-colors"
            >
              How it works
            </a>
          </div>
        </div>
      </div>

      {/* Spacer to give the hero room before scrolling into the animation */}
      <div className="h-[200px]" />

      {/* Embedded How It Works Section */}
      <HowItWorksSection id="how-it-works" />
    </div>
  );
}
