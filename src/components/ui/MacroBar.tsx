"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface MacroBarProps {
  label: string;
  current: number;
  goal: number;
  percentage: number;
  color: "protein" | "carbs" | "fat";
  unit?: string;
  playerNum?: number;
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
}: MacroBarProps) {
  const c = colorMap[color];
  const clampedPct = Math.min(percentage, 100);

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
      className="w-full mb-8 relative"
      animate={flash ? { x: [-4, 4, -4, 4, 0] } : {}}
      transition={{ duration: 0.2 }}
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
          {flash && (
            <motion.div
              className="absolute inset-0 bg-white z-20"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </motion.div>
      </div>

      {/* Numbers Underneath (Street Fighter Style) */}
      <div className="flex justify-end mt-1 px-2">
        <motion.span
          className="font-sans text-3xl text-white sf-text-stroke leading-none"
          animate={flash ? { scale: [1, 1.2, 1], color: ["#fff", "#D32F2F", "#fff"] } : {}}
          transition={{ duration: 0.3 }}
        >
          {Math.round(current)} <span className="text-gray-300 text-2xl">/ {goal}{unit}</span>
        </motion.span>
      </div>
    </motion.div>
  );
}
