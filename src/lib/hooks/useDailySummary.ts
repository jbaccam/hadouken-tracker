"use client";

import { useMemo } from "react";
import { useEntries } from "./useEntries";
import { useProfile } from "./useProfile";

export function useDailySummary(date?: string) {
  const entries = useEntries(date);
  const profile = useProfile();

  const summary = useMemo(() => {
    const items = entries.data ?? [];

    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };

    for (const entry of items) {
      totals.calories += Number(entry.calories) || 0;
      totals.protein += Number(entry.protein) || 0;
      totals.carbs += Number(entry.carbs) || 0;
      totals.fat += Number(entry.fat) || 0;
    }

    const goals = {
      calories: profile.data?.calorie_goal ?? 2000,
      protein: profile.data?.protein_goal ?? 150,
      carbs: profile.data?.carb_goal ?? 250,
      fat: profile.data?.fat_goal ?? 65,
    };

    const remaining = {
      calories: Math.max(0, goals.calories - totals.calories),
      protein: Math.max(0, goals.protein - totals.protein),
      carbs: Math.max(0, goals.carbs - totals.carbs),
      fat: Math.max(0, goals.fat - totals.fat),
    };

    const percentages = {
      calories: goals.calories > 0 ? Math.min(100, (totals.calories / goals.calories) * 100) : 0,
      protein: goals.protein > 0 ? Math.min(100, (totals.protein / goals.protein) * 100) : 0,
      carbs: goals.carbs > 0 ? Math.min(100, (totals.carbs / goals.carbs) * 100) : 0,
      fat: goals.fat > 0 ? Math.min(100, (totals.fat / goals.fat) * 100) : 0,
    };

    return { totals, goals, remaining, percentages };
  }, [entries.data, profile.data]);

  return {
    ...summary,
    entries: entries.data ?? [],
    isLoading: entries.isLoading || profile.isLoading,
    error: entries.error || profile.error,
    profile: profile.data,
  };
}
