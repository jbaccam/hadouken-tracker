"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap, PlusCircle, Swords } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDailySummary } from "@/lib/hooks/useDailySummary";
import { useDeleteEntry } from "@/lib/hooks/useEntries";
import { CalorieRing } from "@/components/ui/CalorieRing";
import { MacroBar } from "@/components/ui/MacroBar";
import { FoodEntryCard } from "@/components/food/FoodEntryCard";
import { toast } from "sonner";

export default function DashboardPage() {
  const { totals, goals, entries, isLoading, profile } =
    useDailySummary();
  const deleteEntry = useDeleteEntry();


  // Screen shake & calorie combo state
  const [shake, setShake] = useState(false);
  const [comboDisplay, setComboDisplay] = useState(0); // currently displayed combo tick
  const [comboMax, setComboMax] = useState(0); // target combo (calories / 100)
  const [comboActive, setComboActive] = useState(false);
  const [pulseTick, setPulseTick] = useState(0); // incremented per combo tick to pulse bars
  const [comboMacroDisplay, setComboMacroDisplay] = useState<{
    protein: number;
    carbs: number;
    fat: number;
  } | null>(null);
  const comboTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const comboTickRef = useRef<NodeJS.Timeout | null>(null);
  const comboMacroPlanRef = useRef<{
    base: { protein: number; carbs: number; fat: number };
    delta: { protein: number; carbs: number; fat: number };
  } | null>(null);
  const initializedRef = useRef(false);
  const prevEntryCount = useRef(0);
  const prevTotalCalories = useRef(0);
  const prevProtein = useRef(0);
  const prevCarbs = useRef(0);
  const prevFat = useRef(0);

  const startComboAnimation = useCallback(
    (
      caloriesAdded: number,
      macroBase?: { protein: number; carbs: number; fat: number },
      macroDelta?: { protein: number; carbs: number; fat: number }
    ) => {
    const comboHits = Math.max(1, Math.floor(caloriesAdded / 100));

    if (comboTickRef.current) clearInterval(comboTickRef.current);
    if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);

      if (macroBase && macroDelta) {
        comboMacroPlanRef.current = { base: macroBase, delta: macroDelta };
        setComboMacroDisplay(macroBase);
      } else {
        comboMacroPlanRef.current = null;
        setComboMacroDisplay(null);
      }

    setComboDisplay(0);
    setComboMax(comboHits);
    setComboActive(true);

    let tick = 0;
    comboTickRef.current = setInterval(() => {
      tick++;
      setComboDisplay(tick);
      setPulseTick((p) => p + 1);

      const macroPlan = comboMacroPlanRef.current;
      if (macroPlan) {
        const progress = tick / comboHits;
        setComboMacroDisplay({
          protein: macroPlan.base.protein + macroPlan.delta.protein * progress,
          carbs: macroPlan.base.carbs + macroPlan.delta.carbs * progress,
          fat: macroPlan.base.fat + macroPlan.delta.fat * progress,
        });
      }

      setShake(true);
      setTimeout(() => setShake(false), 150);

      if (tick >= comboHits) {
        if (comboTickRef.current) clearInterval(comboTickRef.current);

        comboTimeoutRef.current = setTimeout(() => {
          setComboActive(false);
          setComboDisplay(0);
          setComboMax(0);
          setComboMacroDisplay(null);
          comboMacroPlanRef.current = null;
        }, 2000);
      }
    }, 250);
    },
    []
  );


  // Trigger calorie-based combo when new entries arrive
  useEffect(() => {
    const currentCalories = totals.calories;
    const currentProtein = totals.protein;
    const currentCarbs = totals.carbs;
    const currentFat = totals.fat;

    if (!initializedRef.current) {
      initializedRef.current = true;

      const key = "macro-tracker:pending-combo";
      const raw = window.sessionStorage.getItem(key);

      if (raw) {
        try {
          const pending = JSON.parse(raw) as {
            calories?: number;
            protein?: number;
            carbs?: number;
            fat?: number;
          };

          const pendingCalories = Number(pending.calories) || 0;
          const pendingProtein = Number(pending.protein) || 0;
          const pendingCarbs = Number(pending.carbs) || 0;
          const pendingFat = Number(pending.fat) || 0;

          if (pendingCalories >= 100) {
            startComboAnimation(
              pendingCalories,
              {
                protein: Math.max(0, currentProtein - pendingProtein),
                carbs: Math.max(0, currentCarbs - pendingCarbs),
                fat: Math.max(0, currentFat - pendingFat),
              },
              {
                protein: pendingProtein,
                carbs: pendingCarbs,
                fat: pendingFat,
              }
            );
          }
        } catch {
          // ignore bad stored combo payload
        }

        window.sessionStorage.removeItem(key);
      }

      prevEntryCount.current = entries.length;
      prevTotalCalories.current = currentCalories;
      prevProtein.current = currentProtein;
      prevCarbs.current = currentCarbs;
      prevFat.current = currentFat;
      return;
    }

    const caloriesAdded = currentCalories - prevTotalCalories.current;
    const proteinAdded = Math.max(0, currentProtein - prevProtein.current);
    const carbsAdded = Math.max(0, currentCarbs - prevCarbs.current);
    const fatAdded = Math.max(0, currentFat - prevFat.current);

    if (
      entries.length > prevEntryCount.current && caloriesAdded > 0
    ) {
      startComboAnimation(
        caloriesAdded,
        {
          protein: prevProtein.current,
          carbs: prevCarbs.current,
          fat: prevFat.current,
        },
        {
          protein: proteinAdded,
          carbs: carbsAdded,
          fat: fatAdded,
        }
      );
    }

    prevEntryCount.current = entries.length;
    prevTotalCalories.current = currentCalories;
    prevProtein.current = currentProtein;
    prevCarbs.current = currentCarbs;
    prevFat.current = currentFat;
  }, [entries.length, totals.calories, totals.protein, totals.carbs, totals.fat, startComboAnimation]);

  const displayProtein = comboMacroDisplay?.protein ?? totals.protein;
  const displayCarbs = comboMacroDisplay?.carbs ?? totals.carbs;
  const displayFat = comboMacroDisplay?.fat ?? totals.fat;

  const proteinPct = goals.protein > 0 ? (displayProtein / goals.protein) * 100 : 0;
  const carbsPct = goals.carbs > 0 ? (displayCarbs / goals.carbs) * 100 : 0;
  const fatPct = goals.fat > 0 ? (displayFat / goals.fat) * 100 : 0;

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
      className="min-h-screen text-white font-sans flex flex-col items-center justify-start pt-6 p-4 sm:p-8 relative"
      animate={shake ? { x: [-10, 10, -10, 10, 0], y: [-5, 5, -5, 5, 0] } : {}}
      transition={{ duration: 0.2 }}
    >
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

        {/* ═══ CALORIE RING (32-bit Timer) ═══ */}
        <motion.div
          className="flex justify-center mb-14 mt-4 relative"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
        >
          <AnimatePresence>
            {comboActive && comboDisplay > 0 && (
              <motion.div
                className="absolute right-[calc(50%+84px)] top-1/2 -translate-y-1/2 z-50 pointer-events-none flex flex-col items-end"
                initial={{ x: -100, opacity: 0, scale: 0.5 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.5, filter: "blur(10px)" }}
                key="combo-container"
              >
                <motion.span
                  className="font-display text-5xl sm:text-6xl md:text-7xl italic combo-text leading-none"
                  key={comboDisplay}
                  initial={{ scale: 2, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                >
                  {comboDisplay}x
                </motion.span>

                <motion.span
                  className="font-display text-lg sm:text-xl md:text-2xl italic text-red-500 sf-text-stroke -mt-1"
                  key={`label-${comboDisplay}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  {comboDisplay >= comboMax ? "COMBO!" : "HIT!"}
                </motion.span>

                <AnimatePresence>
                  {comboDisplay >= comboMax && (
                    <motion.span
                      className="font-display text-sm sm:text-base md:text-lg tracking-wider text-amber-400 sf-text-stroke mt-1"
                      initial={{ opacity: 0, y: 10, scale: 0.5 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
                    >
                      +{comboMax * 100} CAL
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

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
              current={displayProtein}
              goal={goals.protein}
              percentage={proteinPct}
              color="protein"
              playerNum={1}
              pulseSignal={pulseTick}
            />
            <MacroBar
              label="Carbs"
              current={displayCarbs}
              goal={goals.carbs}
              percentage={carbsPct}
              color="carbs"
              playerNum={2}
              pulseSignal={pulseTick}
            />
            <MacroBar
              label="Fat"
              current={displayFat}
              goal={goals.fat}
              percentage={fatPct}
              color="fat"
              playerNum={3}
              pulseSignal={pulseTick}
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
