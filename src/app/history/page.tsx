"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDailySummary } from "@/lib/hooks/useDailySummary";
import { useDeleteEntry } from "@/lib/hooks/useEntries";
import { MacroBar } from "@/components/ui/MacroBar";
import { FoodEntryCard } from "@/components/food/FoodEntryCard";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

function getWeekDates(offset: number) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() + offset * 7);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d.toLocaleDateString("en-CA");
  });
}

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default function HistoryPage() {
  const today = new Date().toLocaleDateString("en-CA");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(today);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const { totals, goals, percentages, entries, isLoading } = useDailySummary(selectedDate);
  const deleteEntry = useDeleteEntry();

  function handleDelete(id: string) {
    deleteEntry.mutate(id, {
      onError: () => toast.error("Failed to delete entry"),
    });
  }

  function formatWeekLabel() {
    const start = new Date(weekDates[0]);
    const end = new Date(weekDates[6]);
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${start.toLocaleDateString("en-US", opts)} — ${end.toLocaleDateString("en-US", opts)}`;
  }

  return (
    <div className="px-4 pt-4 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-lg tracking-wider text-ember text-glow-ember mb-5"
      >
        HISTORY
      </motion.h1>

      {/* Week nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="sf-btn w-8 h-8 flex items-center justify-center text-foreground/40 hover:text-foreground"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="font-display text-[11px] tracking-wider text-foreground/50 uppercase sf-text-stroke">
          {formatWeekLabel()}
        </span>
        <button
          onClick={() => setWeekOffset((o) => Math.min(0, o + 1))}
          disabled={weekOffset >= 0}
          className="sf-btn w-8 h-8 flex items-center justify-center text-foreground/40 hover:text-foreground disabled:opacity-20"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day selector */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
        {weekDates.map((date, i) => {
          const isSelected = date === selectedDate;
          const isToday = date === today;
          const dayNum = new Date(date).getDate();

          return (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={cn(
                "flex-1 min-w-[42px] py-2 flex flex-col items-center gap-0.5 transition-all",
                isSelected
                  ? "bg-ember/20 border-2 border-ember/40"
                  : "bg-[#111] border-2 border-[#333] hover:border-foreground/20"
              )}
            >
              <span
                className={cn(
                  "font-display text-[8px] tracking-widest",
                  isSelected ? "text-ember" : "text-foreground/30"
                )}
              >
                {DAY_LABELS[i]}
              </span>
              <span
                className={cn(
                  "text-sm tabular-nums font-medium",
                  isSelected ? "text-ember" : "text-foreground/60",
                  isToday && !isSelected && "text-crimson"
                )}
              >
                {dayNum}
              </span>
            </button>
          );
        })}
      </div>

      {/* Daily summary */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDate}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
        >
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-10 bg-surface-2 rounded" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 bg-surface-2 rounded" />
              ))}
            </div>
          ) : (
            <>
              {/* Calorie summary */}
              <div className="sf-card p-4 pl-5 mb-4">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="font-display text-xs tracking-widest text-foreground/50">
                    CALORIES
                  </span>
                  <span className="font-display text-lg text-calories tabular-nums">
                    {Math.round(totals.calories)}
                    <span className="text-xs text-foreground/30 font-normal ml-1">
                      / {goals.calories}
                    </span>
                  </span>
                </div>

                <div className="space-y-3">
                  <MacroBar
                    label="Protein"
                    current={totals.protein}
                    goal={goals.protein}
                    percentage={percentages.protein}
                    color="protein"
                  />
                  <MacroBar
                    label="Carbs"
                    current={totals.carbs}
                    goal={goals.carbs}
                    percentage={percentages.carbs}
                    color="carbs"
                  />
                  <MacroBar
                    label="Fat"
                    current={totals.fat}
                    goal={goals.fat}
                    percentage={percentages.fat}
                    color="fat"
                  />
                </div>
              </div>

              {/* Entry list */}
              {entries.length === 0 ? (
                <div className="sf-card p-6 text-center">
                  <p className="font-display text-xs tracking-wider text-foreground/25">
                    NO ENTRIES
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <FoodEntryCard
                      key={entry.id}
                      entry={entry}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
