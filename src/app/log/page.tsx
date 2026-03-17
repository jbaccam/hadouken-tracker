"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Type, Loader2, Zap, PenLine, BookMarked, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { useProfile } from "@/lib/hooks/useProfile";
import { useCreateEntry } from "@/lib/hooks/useEntries";
import {
  useCreateRecipe,
  useDeleteRecipe,
  useRecipes,
} from "@/lib/hooks/useRecipes";
import { PhotoCapture } from "@/components/food/PhotoCapture";
import { NutritionResult } from "@/components/food/NutritionResult";
import { ManualEntryForm } from "@/components/food/ManualEntryForm";
import { validateFoodSpecificity } from "@/lib/utils/food-specificity";
import type { AnalysisResult, NutritionItem } from "@/types/nutrition";

type Tab = "scan" | "type" | "manual" | "saved";

export default function LogPage() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const createEntry = useCreateEntry();
  const recipes = useRecipes();
  const createRecipe = useCreateRecipe();
  const deleteRecipe = useDeleteRecipe();

  const [tab, setTab] = useState<Tab>("scan");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [textInput, setTextInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(null);
  const [portionMode, setPortionMode] = useState<"grams" | "servings">("servings");
  const [portionValue, setPortionValue] = useState("1");

  const canUseAI = profile?.role === "admin" || profile?.role === "friend";
  const textSpecificity = validateFoodSpecificity(textInput);
  const savedRecipes = recipes.data ?? [];

  function queueCombo(payload: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) {
    if (typeof window === "undefined") return;
    if (!Number.isFinite(payload.calories) || payload.calories <= 0) return;

    const key = "macro-tracker:pending-combo";
    const raw = window.sessionStorage.getItem(key);

    let existing = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<typeof existing>;
        existing = {
          calories: Number(parsed.calories) || 0,
          protein: Number(parsed.protein) || 0,
          carbs: Number(parsed.carbs) || 0,
          fat: Number(parsed.fat) || 0,
        };
      } catch {
        existing = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
    }

    const next = {
      calories: existing.calories + payload.calories,
      protein: existing.protein + payload.protein,
      carbs: existing.carbs + payload.carbs,
      fat: existing.fat + payload.fat,
    };

    window.sessionStorage.setItem(key, JSON.stringify(next));
  }

  async function analyzeContent(type: "image" | "text", content: string) {
    setAnalyzing(true);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content }),
      });

      if (res.status === 403) {
        toast.error("AI features require friend or admin role");
        return;
      }
      if (res.status === 429) {
        toast.error("Daily AI limit reached. Try manual entry.");
        return;
      }
      if (!res.ok) {
        toast.error("Analysis failed. Please try again.");
        return;
      }

      const data: AnalysisResult = await res.json();
      setResult(data);
    } catch {
      toast.error("Network error. Check your connection.");
    } finally {
      setAnalyzing(false);
    }
  }

  function handlePhotoCapture(base64: string) {
    analyzeContent("image", base64);
  }

  function handleTextSubmit() {
    if (!textInput.trim()) return;

    if (!textSpecificity.isSpecific) {
      toast.error(textSpecificity.message ?? "Please add a more specific food description.");
      return;
    }

    analyzeContent("text", textInput.trim());
  }

  async function handleConfirm(items: NutritionItem[]) {
    setSaving(true);
    try {
      for (const item of items) {
        await createEntry.mutateAsync({
          name: item.name,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          fiber: item.fiber ?? 0,
          sugar: item.sugar ?? 0,
          sodium: item.sodium ?? 0,
          serving_size: item.serving_size,
          date: new Date().toLocaleDateString("en-CA"),
          source_type: tab === "scan" ? "photo" : "text",
          ai_confidence: result?.confidence ?? null,
          ai_raw_response: result as unknown as Record<string, unknown>,
        });
      }
      const comboTotals = items.reduce(
        (sum, item) => ({
          calories: sum.calories + item.calories,
          protein: sum.protein + item.protein,
          carbs: sum.carbs + item.carbs,
          fat: sum.fat + item.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      queueCombo(comboTotals);
      toast.success(`${items.length} item${items.length > 1 ? "s" : ""} logged!`);
      router.push("/");
    } catch {
      toast.error("Failed to save entries");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setResult(null);
    setTextInput("");
  }

  async function handleRefine(instruction: string, items: NutritionItem[]) {
    if (!instruction.trim()) return;

    const itemLines = items
      .map(
        (item) =>
          `${item.name}: ${item.serving_size}; cal ${item.calories}, protein ${item.protein}g, carbs ${item.carbs}g, fat ${item.fat}g`
      )
      .join("\n");

    const refinePrompt = [
      "Current nutrition estimate:",
      itemLines,
      "",
      `Adjustment request: ${instruction.trim()}`,
      "",
      "Return corrected nutrition using the requested changes.",
    ].join("\n");

    await analyzeContent("text", refinePrompt);
  }

  async function handleSaveRecipe(payload: {
    name: string;
    items: NutritionItem[];
    totalWeightGrams: number | null;
    servings: number;
  }) {
    try {
      await createRecipe.mutateAsync({
        name: payload.name,
        items: payload.items,
        total_weight_grams: payload.totalWeightGrams,
        servings: payload.servings,
      });
      toast.success(`Saved recipe: ${payload.name}`);
    } catch {
      toast.error("Failed to save recipe");
    }
  }

  async function handleDeleteRecipe(id: string) {
    try {
      await deleteRecipe.mutateAsync(id);
      toast.success("Recipe deleted");
    } catch {
      toast.error("Failed to delete recipe");
      return;
    }

    if (activeRecipeId === id) {
      setActiveRecipeId(null);
      setPortionValue("1");
      setPortionMode("servings");
    }
  }

  async function handleLogSavedRecipe() {
    const recipe = savedRecipes.find((entry) => entry.id === activeRecipeId);
    const amount = Number(portionValue);

    if (!recipe || !Number.isFinite(amount) || amount <= 0) return;

    const scale =
      portionMode === "grams"
        ? amount / (recipe.total_weight_grams ?? 0)
        : amount / recipe.servings;

    if (!Number.isFinite(scale) || scale <= 0) return;

    if (portionMode === "grams" && !recipe.total_weight_grams) {
      toast.error("This recipe has no total grams. Log by servings instead.");
      return;
    }

    const totals = recipe.items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
        fiber: acc.fiber + (item.fiber ?? 0),
        sugar: acc.sugar + (item.sugar ?? 0),
        sodium: acc.sodium + (item.sodium ?? 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
    );

    try {
      await createEntry.mutateAsync({
        name: recipe.name,
        calories: Number((totals.calories * scale).toFixed(1)),
        protein: Number((totals.protein * scale).toFixed(1)),
        carbs: Number((totals.carbs * scale).toFixed(1)),
        fat: Number((totals.fat * scale).toFixed(1)),
        fiber: Number((totals.fiber * scale).toFixed(1)),
        sugar: Number((totals.sugar * scale).toFixed(1)),
        sodium: Number((totals.sodium * scale).toFixed(1)),
        serving_size:
          portionMode === "grams"
            ? `${amount}g of ${recipe.name}`
            : `${amount} serving${amount === 1 ? "" : "s"} of ${recipe.name}`,
        date: new Date().toLocaleDateString("en-CA"),
        source_type: "manual",
        ai_confidence: null,
        ai_raw_response: null,
      });
      queueCombo({
        calories: Number((totals.calories * scale).toFixed(1)),
        protein: Number((totals.protein * scale).toFixed(1)),
        carbs: Number((totals.carbs * scale).toFixed(1)),
        fat: Number((totals.fat * scale).toFixed(1)),
      });
      toast.success(`${recipe.name} logged`);
      router.push("/");
    } catch {
      toast.error("Failed to log recipe");
    }
  }

  return (
    <div className="px-4 pt-4 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-lg tracking-wider text-crimson text-glow-crimson mb-5"
      >
        LOG FOOD
      </motion.h1>

      {/* Tab switcher */}
      <div className="flex overflow-hidden solid-panel mb-6">
        {(
          [
            { id: "scan" as Tab, label: "SCAN", icon: Camera, requiresAI: true },
            { id: "type" as Tab, label: "TYPE", icon: Type, requiresAI: true },
            { id: "manual" as Tab, label: "MANUAL", icon: PenLine, requiresAI: false },
            { id: "saved" as Tab, label: "SAVED", icon: BookMarked, requiresAI: false },
          ] as const
        ).map(({ id, label, icon: Icon, requiresAI }) => (
          <button
            key={id}
            onClick={() => {
              setTab(id);
              setResult(null);
            }}
            disabled={requiresAI && !canUseAI}
            className={cn(
              "flex-1 py-3 flex items-center justify-center gap-1.5 font-display text-[10px] tracking-widest uppercase transition-all",
              tab === id
                ? "bg-crimson/20 text-crimson text-glow-crimson-soft"
                : "text-foreground/40 hover:text-foreground/60",
              requiresAI && !canUseAI && "opacity-30 cursor-not-allowed"
            )}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* AI role notice */}
      {!canUseAI && (tab === "scan" || tab === "type") && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="sf-card p-4 pl-5 mb-6 flex items-start gap-3"
        >
          <Zap size={16} className="text-crimson flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-foreground/60 mb-1">
              AI features require <span className="text-crimson font-medium">friend</span> or{" "}
              <span className="text-crimson font-medium">admin</span> role.
            </p>
            <p className="text-[11px] text-foreground/30">
              Use MANUAL tab to log entries, or ask an admin to upgrade your role.
            </p>
          </div>
        </motion.div>
      )}

      {/* Content area */}
      <AnimatePresence mode="wait">
        {result ? (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <NutritionResult
              result={result}
              onConfirm={handleConfirm}
              onRefine={handleRefine}
              onSaveRecipe={handleSaveRecipe}
              onCancel={handleCancel}
              loading={saving || createRecipe.isPending}
            />
          </motion.div>
        ) : analyzing ? (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 gap-4"
          >
            <Loader2 size={32} className="text-crimson animate-spin" />
            <p className="font-display text-xs tracking-widest text-foreground/40 animate-pulse">
              ANALYZING...
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            {tab === "scan" && (
              <div className="space-y-4">
                <PhotoCapture onCapture={handlePhotoCapture} disabled={!canUseAI} />
                <p className="text-center text-[11px] text-foreground/20 font-display tracking-wider">
                  SNAP A NUTRITION LABEL OR FOOD PHOTO
                </p>
              </div>
            )}

            {tab === "type" && (
              <div className="space-y-4">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="5oz cooked chicken breast and 200g jasmine rice..."
                  rows={4}
                  disabled={!canUseAI}
                  className="w-full sf-input p-4 text-sm resize-none"
                />
                {textInput.trim() && !textSpecificity.isSpecific && (
                  <p className="text-[11px] text-crimson/80">
                    {textSpecificity.message}
                  </p>
                )}
                <p className="text-[11px] text-foreground/35 leading-relaxed">
                  Be specific: include amount, cooked/raw state, and cut or brand.
                  Example: <span className="text-foreground/55">200g cooked chicken thigh</span> or{" "}
                  <span className="text-foreground/55">100g Kellogg&apos;s Frosted Flakes</span>.
                </p>
                <button
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim() || !canUseAI || !textSpecificity.isSpecific}
                  className="sf-btn w-full py-3 bg-crimson font-display text-xs tracking-widest text-white sf-text-stroke hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ANALYZE
                </button>
              </div>
            )}

            {tab === "manual" && (
              <ManualEntryForm
                onSave={async (entry) => {
                  try {
                    await createEntry.mutateAsync(entry);
                    queueCombo({
                      calories: entry.calories,
                      protein: entry.protein,
                      carbs: entry.carbs,
                      fat: entry.fat,
                    });
                    toast.success("Entry logged!");
                    router.push("/");
                  } catch {
                    toast.error("Failed to save entry");
                  }
                }}
                saving={createEntry.isPending}
              />
            )}

            {tab === "saved" && (
              <div className="space-y-3">
                {savedRecipes.length === 0 ? (
                  <div className="sf-card p-4 text-center">
                    <p className="text-xs text-foreground/45 mb-1">No saved recipes yet.</p>
                    <p className="text-[11px] text-foreground/30">
                      Analyze a meal, then use <span className="text-foreground/55">SAVE RECIPE</span>.
                    </p>
                  </div>
                ) : (
                  savedRecipes.map((recipe) => (
                    <div key={recipe.id} className="sf-card p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <button
                          onClick={() => {
                            setActiveRecipeId(recipe.id);
                            setPortionMode("servings");
                            setPortionValue("1");
                          }}
                          className="text-left flex-1"
                        >
                          <p className="font-display text-xs tracking-wider text-foreground/80">
                            {recipe.name}
                          </p>
                          <p className="text-[11px] text-foreground/35">
                            {recipe.servings} servings
                            {recipe.total_weight_grams ? `, ${recipe.total_weight_grams}g total` : ""}
                          </p>
                        </button>
                        <button
                          onClick={() => handleDeleteRecipe(recipe.id)}
                          className="text-foreground/30 hover:text-crimson transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {activeRecipeId === recipe.id && (
                        <div className="space-y-2 border-t border-white/10 pt-3">
                          <div className="flex gap-2 text-[11px]">
                            <button
                              onClick={() => {
                                setPortionMode("servings");
                                setPortionValue("1");
                              }}
                              className={cn(
                                "sf-btn px-3 py-1.5",
                                portionMode === "servings"
                                  ? "bg-crimson/20 text-crimson"
                                  : "text-foreground/50"
                              )}
                            >
                              By servings
                            </button>
                            <button
                              onClick={() => {
                                if (!recipe.total_weight_grams) return;
                                setPortionMode("grams");
                                setPortionValue("100");
                              }}
                              disabled={!recipe.total_weight_grams}
                              className={cn(
                                "sf-btn px-3 py-1.5",
                                portionMode === "grams"
                                  ? "bg-crimson/20 text-crimson"
                                  : "text-foreground/50",
                                !recipe.total_weight_grams && "opacity-40 cursor-not-allowed"
                              )}
                            >
                              By grams
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0.1}
                              step={portionMode === "servings" ? 0.25 : 1}
                              value={portionValue}
                              onChange={(e) => setPortionValue(e.target.value)}
                              className="w-full sf-input px-3 py-2 text-xs"
                              placeholder={portionMode === "servings" ? "Servings eaten" : "Grams eaten"}
                            />
                            <button
                              onClick={handleLogSavedRecipe}
                               disabled={Number(portionValue) <= 0 || createEntry.isPending}
                              className="sf-btn px-4 py-2 bg-power-green text-white text-[10px] font-display tracking-widest disabled:opacity-40"
                            >
                              LOG
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
