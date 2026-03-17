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

  if (pathname.startsWith("/auth")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      {/* Chrome top trim line */}
      <div
        className="h-[2px]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(211,47,47,0.4) 30%, rgba(211,47,47,0.6) 50%, rgba(211,47,47,0.4) 70%, transparent 100%)",
        }}
      />
      <div
        style={{
          background: "#0a0a0a",
          borderTop: "2px solid #333",
        }}
      >
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
                    isActive ? "text-red-500" : "text-zinc-500"
                  )}
                >
                  <div className="relative">
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                    {isActive && (
                      <>
                        <motion.div
                          layoutId="nav-glow"
                          className="absolute -inset-3 rounded-full blur-lg"
                          style={{ background: "rgba(211,47,47,0.2)" }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-display tracking-wider",
                      isActive && "text-glow-crimson-soft"
                    )}
                  >
                    {tab.label}
                  </span>
                </motion.div>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[2px] rounded-full"
                    style={{
                      background: "linear-gradient(90deg, transparent, #D32F2F, transparent)",
                      boxShadow: "0 0 8px rgba(211,47,47,0.5)",
                    }}
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
