"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BottomNav } from "./BottomNav";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname.startsWith("/auth");

  return (
    <div className="min-h-[100dvh] flex flex-col bg-sf-stage">
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className={`flex-1 safe-top safe-left safe-right relative z-10 ${
            isAuth ? "" : "pb-20"
          }`}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      {!isAuth && <BottomNav />}
    </div>
  );
}
