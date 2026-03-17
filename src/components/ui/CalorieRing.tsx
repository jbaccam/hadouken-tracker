"use client";

import { motion } from "framer-motion";

interface CalorieRingProps {
  current: number;
  goal: number;
}

export function CalorieRing({ current, goal }: CalorieRingProps) {
  const display = Math.round(current);
  const digitCount = Math.abs(display).toString().length;
  const flashKey = current > 0 ? display : 0;

  const valueTextClass =
    digitCount >= 6
      ? "text-3xl sm:text-4xl"
      : digitCount >= 5
        ? "text-4xl sm:text-5xl"
        : "text-5xl sm:text-6xl";

  return (
    <motion.div
      key={`ring-${flashKey}`}
      className="flex flex-col items-center justify-center relative"
      animate={current > 0 ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute -top-6 z-20">
        <span className="font-display text-2xl text-white sf-text-stroke tracking-widest">
          CALORIES
        </span>
      </div>

      <div className="relative w-36 h-36 bg-gradient-to-b from-zinc-700 to-zinc-900 rounded-full border-[6px] border-black shadow-[0_10px_20px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center z-10 overflow-visible">
        <div className="absolute inset-1 rounded-full border-4 border-red-600/50 pointer-events-none" />

        <motion.div
          key={`value-${flashKey}`}
          className={`font-display ${valueTextClass} text-white sf-text-stroke leading-none mt-2 relative z-10 whitespace-nowrap`}
          animate={current > 0 ? { color: ["#fff", "#D32F2F", "#fff"] } : {}}
          transition={{ duration: 0.3 }}
        >
          {display}
        </motion.div>

        {current > 0 && (
          <motion.div
            key={`overlay-${flashKey}`}
            className="absolute inset-0 bg-white z-20 rounded-full"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </div>

      <div className="absolute -bottom-6 z-20 bg-black/80 px-4 py-1 border-2 border-zinc-700 skew-x-[-10deg]">
        <span className="font-sans text-2xl text-red-500 sf-text-stroke skew-x-[10deg] block">
          MAX {goal}
        </span>
      </div>
    </motion.div>
  );
}
