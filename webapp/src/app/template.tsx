"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { GlobalHeader } from "@/components/GlobalHeader";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <>
      {!isHome && <GlobalHeader />}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        className="flex-1 flex flex-col items-center w-full"
      >
        {children}
      </motion.div>
    </>
  );
}
