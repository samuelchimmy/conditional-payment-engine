import Link from "next/link";

export function Header() {
  return (
    <header className="w-full flex flex-col items-center justify-center pt-10 pb-6">
      <Link href="/" className="flex items-baseline gap-0.5 hover:opacity-90 transition-opacity">
        <span className="font-[800] text-text-primary text-[32px] tracking-tight">tether</span>
        <span className="font-[800] text-text-secondary text-[32px]">.</span>
        <span className="font-[400] text-text-primary text-[32px] tracking-tight">arena</span>
      </Link>
      <p className="text-text-secondary text-[15px] font-bold mt-1">
        The Conditional Payment Engine
      </p>
    </header>
  );
}
