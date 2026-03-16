"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname.startsWith("/auth");

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <main
        className={`flex-1 safe-top safe-left safe-right ${
          isAuth ? "" : "pb-20"
        }`}
      >
        {children}
      </main>
      {!isAuth && <BottomNav />}
    </div>
  );
}
