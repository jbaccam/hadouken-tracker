"use client";

import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Trash2, Camera, MessageSquare, PenLine } from "lucide-react";
import type { FoodEntry } from "@/types/database";
import { cn } from "@/lib/utils/cn";

interface FoodEntryCardProps {
  entry: FoodEntry;
  onDelete: (id: string) => void;
}

const sourceIcon = {
  photo: Camera,
  text: MessageSquare,
  manual: PenLine,
};

function confidenceColor(confidence: number | null) {
  if (!confidence) return null;
  if (confidence >= 0.9) return "bg-power-green";
  if (confidence >= 0.7) return "bg-carbs";
  return "bg-crimson";
}

export function FoodEntryCard({ entry, onDelete }: FoodEntryCardProps) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-120, -60], [1, 0]);
  const deleteScale = useTransform(x, [-120, -60], [1, 0.5]);

  const SourceIcon = sourceIcon[entry.source_type] || PenLine;

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -100) {
      onDelete(entry.id);
    }
  }

  return (
    <div className="relative overflow-hidden">
      {/* Delete zone behind card */}
      <motion.div
        className="absolute inset-y-0 right-0 w-20 flex items-center justify-center bg-crimson/20"
        style={{ opacity: deleteOpacity, scale: deleteScale }}
      >
        <Trash2 size={20} className="text-crimson" />
      </motion.div>

      {/* Draggable card */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -130, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative sf-card p-3 pl-5 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-sans font-bold text-2xl text-white sf-text-stroke uppercase leading-none tracking-wide -skew-x-6">
                {entry.name}
              </h3>
              {entry.ai_confidence !== null && (
                <span
                  className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    confidenceColor(entry.ai_confidence)
                  )}
                  title={`AI confidence: ${Math.round((entry.ai_confidence ?? 0) * 100)}%`}
                />
              )}
            </div>

            <p className="font-sans text-md text-yellow-500 font-bold uppercase tracking-widest mt-1">
              {entry.serving_size || <SourceIcon size={12} />}
            </p>
          </div>

          {/* Macro summary */}
          <div className="text-right flex flex-col items-end">
            <div className="font-display text-4xl text-calories sf-text-stroke leading-none tracking-wider tabular-nums">
              {Math.round(Number(entry.calories))}{" "}
              <span className="text-lg text-white sf-text-stroke">CAL</span>
            </div>

            <div className="font-sans text-sm font-bold space-x-3 uppercase mt-1 tabular-nums">
              <span className="text-protein sf-text-stroke">{Math.round(Number(entry.protein))}P</span>
              <span className="text-carbs sf-text-stroke">{Math.round(Number(entry.carbs))}C</span>
              <span className="text-fat sf-text-stroke">{Math.round(Number(entry.fat))}F</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
