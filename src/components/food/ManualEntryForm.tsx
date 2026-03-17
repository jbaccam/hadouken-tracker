"use client";

import { useState } from "react";
import { PenLine } from "lucide-react";
import type { InsertFoodEntry } from "@/types/database";
import { cn } from "@/lib/utils/cn";

interface ManualEntryFormProps {
  onSave: (entry: InsertFoodEntry) => void;
  saving?: boolean;
}

export function ManualEntryForm({ onSave, saving }: ManualEntryFormProps) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [servingSize, setServingSize] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !calories) return;

    onSave({
      name: name.trim(),
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      serving_size: servingSize || null,
      date: new Date().toLocaleDateString("en-CA"),
      source_type: "manual",
      ai_confidence: null,
      ai_raw_response: null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-1.5">
        <label className="font-display text-[10px] tracking-widest text-foreground/50 uppercase">
          Food Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Chicken breast, rice..."
          className="w-full sf-input py-3 px-4 text-sm"
        />
      </div>

      {/* Serving size */}
      <div className="space-y-1.5">
        <label className="font-display text-[10px] tracking-widest text-foreground/50 uppercase">
          Serving Size
        </label>
        <input
          value={servingSize}
          onChange={(e) => setServingSize(e.target.value)}
          placeholder="5oz, 1 cup, etc."
          className="w-full sf-input py-3 px-4 text-sm"
        />
      </div>

      {/* Macros grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Calories", value: calories, setter: setCalories, color: "text-calories", required: true },
          { label: "Protein (g)", value: protein, setter: setProtein, color: "text-protein", required: false },
          { label: "Carbs (g)", value: carbs, setter: setCarbs, color: "text-carbs", required: false },
          { label: "Fat (g)", value: fat, setter: setFat, color: "text-fat", required: false },
        ].map(({ label, value, setter, color, required }) => (
          <div key={label} className="space-y-1.5">
            <label className={cn("font-display text-[10px] tracking-widest uppercase", color)}>
              {label}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setter(e.target.value)}
              required={required}
              min={0}
              step="any"
              placeholder="0"
              className="w-full sf-input py-3 px-4 text-sm tabular-nums"
            />
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={saving || !name.trim() || !calories}
        className="sf-btn w-full py-3.5 bg-power-green font-display text-xs tracking-widest text-white sf-text-stroke hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <PenLine size={14} />
        LOG IT
      </button>
    </form>
  );
}
