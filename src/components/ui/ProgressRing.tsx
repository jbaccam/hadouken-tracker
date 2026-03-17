"use client";

import { motion } from "framer-motion";

interface ProgressRingProps {
  percentage: number;
  current: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

function getColors(pct: number) {
  if (pct >= 95) return { main: "#D32F2F", glow: "rgba(211,47,47,0.4)", accent: "#FF5252" };
  if (pct >= 75) return { main: "#FFB300", glow: "rgba(255,179,0,0.4)", accent: "#FFD54F" };
  return { main: "#4CAF50", glow: "rgba(76,175,80,0.4)", accent: "#81C784" };
}

export function ProgressRing({
  percentage,
  current,
  goal,
  size = 190,
  strokeWidth = 14,
  label = "CALORIES",
}: ProgressRingProps) {
  const radius = (size - strokeWidth - 8) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;
  const { main, glow, accent } = getColors(percentage);
  const center = size / 2;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          {/* Chrome border gradient */}
          <linearGradient id="chrome-ring" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
            <stop offset="50%" stopColor="rgba(232,184,0,0.15)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="bar-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Decorative outer tick marks */}
        {Array.from({ length: 24 }, (_, i) => {
          const angle = (i / 24) * 360;
          const rad = (angle * Math.PI) / 180;
          const outerR = center - 2;
          const innerR = center - (i % 6 === 0 ? 8 : 5);
          return (
            <line
              key={i}
              x1={center + outerR * Math.cos(rad)}
              y1={center + outerR * Math.sin(rad)}
              x2={center + innerR * Math.cos(rad)}
              y2={center + innerR * Math.sin(rad)}
              stroke={i % 6 === 0 ? "rgba(232,184,0,0.3)" : "rgba(255,255,255,0.08)"}
              strokeWidth={i % 6 === 0 ? 1.5 : 0.5}
            />
          );
        })}

        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-surface-2)"
          strokeWidth={strokeWidth}
        />

        {/* Chrome outer ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#chrome-ring)"
          strokeWidth={strokeWidth + 4}
          opacity={0.5}
        />

        {/* Progress arc — with glow */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={main}
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
          filter="url(#bar-glow)"
        />

        {/* Inner highlight arc (3D effect) */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius - strokeWidth / 4}
          fill="none"
          stroke={accent}
          strokeWidth={2}
          strokeLinecap="butt"
          strokeDasharray={circumference * 0.95}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (Math.min(percentage, 100) / 100) * circumference * 0.95 }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
          opacity={0.4}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-display text-3xl tabular-nums"
          style={{
            color: main,
            textShadow: `0 0 12px ${glow}, 0 0 24px ${glow}`,
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {Math.round(current)}
        </motion.span>
        <span className="text-foreground/40 text-xs font-semibold">/ {goal}</span>
        <span className="font-display text-[9px] tracking-[0.25em] text-foreground/30 mt-1 uppercase">
          {label}
        </span>
      </div>
    </div>
  );
}
