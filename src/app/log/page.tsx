"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Type, Loader2, Zap, PenLine } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { useProfile } from "@/lib/hooks/useProfile";
import { useCreateEntry } from "@/lib/hooks/useEntries";
import { PhotoCapture } from "@/components/food/PhotoCapture";
import { NutritionResult } from "@/components/food/NutritionResult";
import { ManualEntryForm } from "@/components/food/ManualEntryForm";
import type { AnalysisResult, NutritionItem } from "@/types/nutrition";

type Tab = "scan" | "type" | "manual";

export default function LogPage() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const createEntry = useCreateEntry();

  const [tab, setTab] = useState<Tab>("scan");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [textInput, setTextInput] = useState("");
  const [imageData, setImageData] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canUseAI = profile?.role === "admin" || profile?.role === "friend";

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
    setImageData(base64);
    analyzeContent("image", base64);
  }

  function handleTextSubmit() {
    if (!textInput.trim()) return;
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
    setImageData(null);
    setTextInput("");
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
      {!canUseAI && tab !== "manual" && (
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
              onCancel={handleCancel}
              loading={saving}
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
                <button
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim() || !canUseAI}
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
                    toast.success("Entry logged!");
                    router.push("/");
                  } catch {
                    toast.error("Failed to save entry");
                  }
                }}
                saving={createEntry.isPending}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
