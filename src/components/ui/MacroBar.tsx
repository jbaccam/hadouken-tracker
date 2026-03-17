"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface MacroBarProps {
  label: string;
  current: number;
  goal: number;
  percentage: number;
  color: "protein" | "carbs" | "fat";
  unit?: string;
  playerNum?: number;
  /** Incremented externally to trigger pulse/shake animations */
  pulseSignal?: number;
}

const colorMap = {
  protein: {
    fill: "linear-gradient(90deg, #86efac 0%, #4ade80 100%)",
    bg: "bg-green-950",
  },
  carbs: {
    fill: "linear-gradient(90deg, #22d3ee 0%, #3b82f6 100%)",
    bg: "bg-blue-950",
  },
  fat: {
    fill: "linear-gradient(90deg, #fb923c 0%, #ef4444 100%)",
    bg: "bg-orange-950",
  },
};

export function MacroBar({
  label,
  current,
  goal,
  percentage,
  color,
  unit = "g",
  playerNum = 1,
  pulseSignal = 0,
}: MacroBarProps) {
  const c = colorMap[color];
  const clampedPct = Math.min(percentage, 100);

  const [flash, setFlash] = useState(false);

  // Flash on value change
  useEffect(() => {
    if (current > 0) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 300);
      return () => clearTimeout(timer);
    }
  }, [current]);

  // Flash on each combo pulse tick
  useEffect(() => {
    if (pulseSignal > 0) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 200);
      return () => clearTimeout(timer);
    }
  }, [pulseSignal]);

  return (
    <motion.div
      className="w-full mb-8 relative"
      animate={
        flash
          ? {
              x: [-6, 6, -6, 6, -3, 3, 0],
              scaleY: [1, 1.04, 0.97, 1.03, 1],
            }
          : {}
      }
      transition={{ duration: 0.25 }}
    >
      {/* Player/Label Tag (Street Fighter Style Nameplate) */}
      <div className="absolute -top-5 left-2 z-10 flex items-end gap-2">
        <span className="font-display text-2xl text-white sf-text-stroke tracking-wide">
          {label.toUpperCase()}
        </span>
        <span className="font-sans text-xl text-red-500 sf-text-stroke mb-0.5">
          P{playerNum}
        </span>
      </div>

      {/* 32-bit Health Bar Container */}
      <div className={`relative h-10 w-full sf-bar-casing skew-x-[-20deg] ${c.bg} overflow-hidden`}>
        {/* Animated fill with smooth 32-bit gradient */}
        <motion.div
          className="h-full relative origin-left"
          initial={{ width: 0 }}
          animate={{ width: `${clampedPct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ background: c.fill }}
        >
          {/* 32-bit Sprite Gloss */}
          <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/50 to-transparent" />

          {/* Bottom shadow for depth */}
          <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-black/40 to-transparent" />

          {/* Bright leading edge */}
          <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />

          {/* White Flash Overlay on Hit */}
          <AnimatePresence>
            {flash && (
              <motion.div
                className="absolute inset-0 bg-white z-20"
                initial={{ opacity: 0.9 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                key={pulseSignal}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Numbers Underneath (Street Fighter Style) */}
      <div className="flex justify-end mt-1 px-2">
        <motion.span
          className="font-sans text-3xl text-white sf-text-stroke leading-none"
          animate={
            flash
              ? { scale: [1, 1.3, 1], color: ["#fff", "#FF1744", "#fff"] }
              : {}
          }
          transition={{ duration: 0.25 }}
        >
          {Math.round(current)} <span className="text-gray-300 text-2xl">/ {goal}{unit}</span>
        </motion.span>
      </div>
    </motion.div>
  );
}
