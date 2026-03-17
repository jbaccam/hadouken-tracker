"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface CalorieRingProps {
  current: number;
  goal: number;
}

export function CalorieRing({ current, goal }: CalorieRingProps) {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (current > 0) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 300);
      return () => clearTimeout(timer);
    }
  }, [current]);

  return (
    <motion.div
      className="flex flex-col items-center justify-center relative"
      animate={flash ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.2 }}
    >
      {/* "TIME" / Round Indicator */}
      <div className="absolute -top-6 z-20">
        <span className="font-display text-2xl text-white sf-text-stroke tracking-widest">
          CALORIES
        </span>
      </div>

      {/* 32-bit Timer Crest/Shield */}
      <div className="relative w-36 h-36 bg-gradient-to-b from-zinc-700 to-zinc-900 rounded-full border-[6px] border-black shadow-[0_10px_20px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center z-10 overflow-hidden">
        {/* Inner Red Ring */}
        <div className="absolute inset-1 rounded-full border-4 border-red-600/50 pointer-events-none" />

        {/* Big 32-bit Numbers */}
        <motion.div
          className="font-display text-6xl text-white sf-text-stroke leading-none mt-2 relative z-10"
          animate={flash ? { color: ["#fff", "#D32F2F", "#fff"] } : {}}
          transition={{ duration: 0.3 }}
        >
          {current}
        </motion.div>

        {/* White Flash Overlay */}
        {flash && (
          <motion.div
            className="absolute inset-0 bg-white z-20 rounded-full"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </div>

      {/* Goal underneath timer */}
      <div className="absolute -bottom-6 z-20 bg-black/80 px-4 py-1 border-2 border-zinc-700 skew-x-[-10deg]">
        <span className="font-sans text-2xl text-red-500 sf-text-stroke skew-x-[10deg] block">
          MAX {goal}
        </span>
      </div>
    </motion.div>
  );
}
