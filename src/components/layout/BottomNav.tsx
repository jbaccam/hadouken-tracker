"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, CalendarDays, Settings } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { motion } from "framer-motion";

const tabs = [
  { href: "/", label: "FIGHT", icon: Home },
  { href: "/log", label: "LOG", icon: PlusCircle },
  { href: "/history", label: "HISTORY", icon: CalendarDays },
  { href: "/settings", label: "CONFIG", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  // Hide nav on auth pages
  if (pathname.startsWith("/auth")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div className="bg-surface border-t border-border backdrop-blur-sm bg-opacity-95">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {tabs.map((tab) => {
            const isActive =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="relative flex flex-col items-center justify-center w-full h-full"
              >
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className={cn(
                    "flex flex-col items-center gap-0.5 transition-colors duration-200",
                    isActive ? "text-electric-blue" : "text-foreground/40"
                  )}
                >
                  <div className="relative">
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                    {isActive && (
                      <motion.div
                        layoutId="nav-glow"
                        className="absolute -inset-2 rounded-full bg-electric-blue/10 blur-md"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-display tracking-wider",
                      isActive && "text-glow-blue"
                    )}
                  >
                    {tab.label}
                  </span>
                </motion.div>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-electric-blue rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
