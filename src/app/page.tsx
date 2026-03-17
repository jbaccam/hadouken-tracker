"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap, PlusCircle, Swords } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useDailySummary } from "@/lib/hooks/useDailySummary";
import { useDeleteEntry } from "@/lib/hooks/useEntries";
import { CalorieRing } from "@/components/ui/CalorieRing";
import { MacroBar } from "@/components/ui/MacroBar";
import { FoodEntryCard } from "@/components/food/FoodEntryCard";
import { toast } from "sonner";

export default function DashboardPage() {
  const { totals, goals, percentages, entries, isLoading, profile } =
    useDailySummary();
  const deleteEntry = useDeleteEntry();

  // Ryu sprite animation
  const [ryuFrames, setRyuFrames] = useState<string[]>([
    "/sprites/02_Ryu/02593.png",
  ]);
  const [ryuFrameIndex, setRyuFrameIndex] = useState(0);

  // Screen shake & combo state
  const [shake, setShake] = useState(false);
  const [combo, setCombo] = useState(0);
  const comboTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevEntryCount = useRef(0);

  // Load Ryu frames
  useEffect(() => {
    let isMounted = true;
    fetch("/api/ryu-frames")
      .then((res) => res.json())
      .then((frames: string[]) => {
        if (!isMounted) return;
        setRyuFrames(frames);
        setRyuFrameIndex(0);
      })
      .catch(() => {
        if (!isMounted) return;
        setRyuFrames(["/sprites/02_Ryu/02593.png"]);
      });
    return () => { isMounted = false; };
  }, []);

  // Animate Ryu
  useEffect(() => {
    if (ryuFrames.length === 0) return;
    const ryuInterval = setInterval(() => {
      setRyuFrameIndex((prev) => (prev + 1) % ryuFrames.length);
    }, 70);
    return () => clearInterval(ryuInterval);
  }, [ryuFrames.length]);

  // Trigger combo + shake when new entries arrive
  useEffect(() => {
    if (entries.length > prevEntryCount.current && prevEntryCount.current > 0) {
      setShake(true);
      setTimeout(() => setShake(false), 200);

      setCombo((prev) => prev + 1);
      if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
      comboTimeoutRef.current = setTimeout(() => setCombo(0), 3000);
    }
    prevEntryCount.current = entries.length;
  }, [entries.length]);

  function handleDelete(id: string) {
    deleteEntry.mutate(id, {
      onError: () => toast.error("Failed to delete entry"),
    });
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <motion.div
      className="min-h-screen text-white font-sans flex flex-col items-center justify-start pt-6 p-4 sm:p-8 overflow-hidden relative"
      animate={shake ? { x: [-10, 10, -10, 10, 0], y: [-5, 5, -5, 5, 0] } : {}}
      transition={{ duration: 0.2 }}
    >
      {/* Combo Counter Overlay */}
      <AnimatePresence>
        {combo > 1 && (
          <motion.div
            className="absolute left-8 top-1/3 z-50 pointer-events-none flex flex-col items-start"
            initial={{ x: -100, opacity: 0, scale: 0.5 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5, filter: "blur(10px)" }}
            key={combo}
          >
            <span className="font-display text-6xl md:text-8xl italic combo-text leading-none">
              {combo}
            </span>
            <span className="font-display text-2xl md:text-4xl italic text-red-500 sf-text-stroke -mt-2">
              HITS!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-2xl z-10 relative">
        {/* ═══ HEADER — ROUND COUNTER STYLE ═══ */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-4"
        >
          <div className="flex items-center justify-between px-2">
            <div>
              <h1 className="font-display text-2xl tracking-wider text-metallic">
                ROUND 1
              </h1>
              <p className="text-sm text-zinc-400 font-sans tracking-widest">
                {new Date()
                  .toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })
                  .toUpperCase()}
              </p>
            </div>
            {profile && (
              <div className="flex items-center gap-1.5 text-sm font-display tracking-wider">
                <Zap size={14} className="text-red-500 energy-pulse" />
                <span className="text-red-500/70 uppercase">
                  {profile.role}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* ═══ RYU HERO STAGE ═══ */}
        <div className="arcade-hero">
          <div className="arcade-hero__stage">
            <div className="arcade-hero__floor" />
            <div className="arcade-hero__spotlight" />
            <div className="arcade-hero__ryu">
              {ryuFrames.length > 0 ? (
                <img
                  key={ryuFrames[ryuFrameIndex]}
                  src={ryuFrames[ryuFrameIndex]}
                  alt="Ryu animation"
                />
              ) : null}
            </div>
          </div>
        </div>

        {/* ═══ CALORIE RING (32-bit Timer) ═══ */}
        <motion.div
          className="flex justify-center mb-14 mt-4"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
        >
          <CalorieRing
            current={totals.calories}
            goal={goals.calories}
          />
        </motion.div>

        {/* ═══ MACRO BARS — STREET FIGHTER HEALTH BARS ═══ */}
        <motion.div
          className="relative w-full"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        >
          <div className="space-y-10">
            <MacroBar
              label="Protein"
              current={totals.protein}
              goal={goals.protein}
              percentage={percentages.protein}
              color="protein"
              playerNum={1}
            />
            <MacroBar
              label="Carbs"
              current={totals.carbs}
              goal={goals.carbs}
              percentage={percentages.carbs}
              color="carbs"
              playerNum={2}
            />
            <MacroBar
              label="Fat"
              current={totals.fat}
              goal={goals.fat}
              percentage={percentages.fat}
              color="fat"
              playerNum={3}
            />
          </div>
        </motion.div>

        {/* ═══ DECORATIVE DIVIDER ═══ */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="divider-ornament my-8"
        />

        {/* ═══ ENTRIES LIST ═══ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Swords size={14} className="text-red-400/50" />
              <h2 className="font-display text-lg tracking-widest text-zinc-400 uppercase">
                Battle Log
              </h2>
            </div>
            <Link
              href="/log"
              className="flex items-center gap-1 text-red-500 text-sm font-display tracking-wider hover:text-red-400 transition-colors"
            >
              <PlusCircle size={15} />
              ADD
            </Link>
          </div>

          {entries.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-2">
              {entries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 + i * 0.05 }}
                >
                  <FoodEntryCard entry={entry} onDelete={handleDelete} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <Link href="/log">
      <div className="relative sf-card p-8 text-center overflow-hidden">
        <div className="shimmer absolute inset-0 pointer-events-none" />
        <p className="font-display text-lg tracking-wider text-zinc-400 sf-text-stroke mb-1 relative">
          NO ENTRIES
        </p>
        <p className="font-display text-sm tracking-[0.3em] text-red-400/50 sf-text-stroke relative">
          INSERT COIN TO FIGHT
        </p>
      </div>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto animate-pulse">
      <div className="h-8 w-36 bg-zinc-800 rounded mb-6" />
      <div className="h-[200px] bg-zinc-800 rounded-2xl mb-6" />
      <div className="flex justify-center mb-10">
        <div className="w-36 h-36 rounded-full bg-zinc-800" />
      </div>
      <div className="space-y-10 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-4 w-24 bg-zinc-800 rounded" />
            <div className="h-10 bg-zinc-800 rounded skew-x-[-20deg]" />
          </div>
        ))}
      </div>
    </div>
  );
}
