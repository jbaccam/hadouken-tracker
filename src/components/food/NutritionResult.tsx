"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, AlertTriangle, Shield } from "lucide-react";
import type { AnalysisResult, NutritionItem } from "@/types/nutrition";
import { cn } from "@/lib/utils/cn";

interface NutritionResultProps {
  result: AnalysisResult;
  onConfirm: (items: NutritionItem[]) => void;
  onCancel: () => void;
  loading?: boolean;
}

function confidenceBadge(confidence: number) {
  if (confidence >= 0.9) return { label: "HIGH", color: "text-power-green", bg: "bg-power-green/10" };
  if (confidence >= 0.7) return { label: "MED", color: "text-carbs", bg: "bg-carbs/10" };
  return { label: "LOW", color: "text-crimson", bg: "bg-crimson/10" };
}

export function NutritionResult({ result, onConfirm, onCancel, loading }: NutritionResultProps) {
  const [editedItems, setEditedItems] = useState<NutritionItem[]>(result.items);

  if (result.rejected) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="sf-card p-6 text-center"
      >
        <AlertTriangle size={32} className="text-crimson mx-auto mb-3" />
        <p className="font-display text-sm tracking-wider text-crimson mb-1">
          FOOD ITEMS ONLY
        </p>
        <p className="text-xs text-foreground/40">
          Please provide food items or nutrition labels.
        </p>
        <button
          onClick={onCancel}
          className="mt-4 sf-btn px-6 py-2 font-display text-xs tracking-wider text-foreground/60 hover:text-foreground"
        >
          TRY AGAIN
        </button>
      </motion.div>
    );
  }

  const badge = confidenceBadge(result.confidence);

  function updateItem(index: number, field: keyof NutritionItem, value: string | number) {
    setEditedItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Confidence header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={14} className={badge.color} />
          <span className={cn("font-display text-[10px] tracking-widest", badge.color)}>
            {badge.label} CONFIDENCE
          </span>
        </div>
        <span className="text-[11px] text-foreground/30 tabular-nums">
          {Math.round(result.confidence * 100)}%
        </span>
      </div>

      {/* Items */}
      {editedItems.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="sf-card p-4 pl-5 space-y-3"
        >
          {/* Name + Serving */}
          <div className="space-y-2">
            <input
              value={item.name}
              onChange={(e) => updateItem(i, "name", e.target.value)}
              className="w-full bg-transparent text-sm font-bold text-white sf-text-stroke uppercase border-b border-[#333] pb-1 focus:outline-none focus:border-crimson/50"
            />
            <input
              value={item.serving_size}
              onChange={(e) => updateItem(i, "serving_size", e.target.value)}
              className="w-full bg-transparent text-[11px] text-foreground/40 focus:outline-none focus:text-foreground/60"
            />
          </div>

          {/* Macro grid */}
          <div className="grid grid-cols-4 gap-2">
            {(
              [
                { key: "calories", label: "CAL", color: "text-calories" },
                { key: "protein", label: "PRO", color: "text-protein" },
                { key: "carbs", label: "CARB", color: "text-carbs" },
                { key: "fat", label: "FAT", color: "text-fat" },
              ] as const
            ).map(({ key, label, color }) => (
              <div key={key} className="text-center">
                <label className={cn("block font-display text-[8px] tracking-widest mb-1", color)}>
                  {label}
                </label>
                <input
                  type="number"
                  value={item[key]}
                  onChange={(e) => updateItem(i, key, Number(e.target.value) || 0)}
                  className="w-full sf-input px-2 py-1.5 text-center text-xs tabular-nums"
                />
              </div>
            ))}
          </div>

          {/* Optional macros */}
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { key: "fiber", label: "FIBER" },
                { key: "sugar", label: "SUGAR" },
                { key: "sodium", label: "SODIUM" },
              ] as const
            ).map(({ key, label }) => (
              <div key={key} className="text-center">
                <label className="block font-display text-[7px] tracking-widest text-foreground/30 mb-1">
                  {label}
                </label>
                <input
                  type="number"
                  value={item[key] ?? ""}
                  onChange={(e) =>
                    updateItem(i, key, e.target.value === "" ? 0 : Number(e.target.value))
                  }
                  placeholder="—"
                  className="w-full sf-input px-2 py-1 text-center text-[11px] tabular-nums"
                />
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Notes */}
      {result.notes && (
        <p className="text-[11px] text-foreground/30 italic px-1">{result.notes}</p>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 sf-btn py-3 font-display text-xs tracking-widest text-foreground/50 hover:text-foreground flex items-center justify-center gap-2"
        >
          <X size={14} />
          CANCEL
        </button>
        <button
          onClick={() => onConfirm(editedItems)}
          disabled={loading}
          className="flex-1 sf-btn py-3 bg-power-green font-display text-xs tracking-widest text-white sf-text-stroke hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <Check size={14} />
          LOG IT
        </button>
      </div>
    </motion.div>
  );
}
