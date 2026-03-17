"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { compressImage } from "@/lib/utils/image";
import { cn } from "@/lib/utils/cn";

interface PhotoCaptureProps {
  onCapture: (base64: string) => void;
  disabled?: boolean;
}

export function PhotoCapture({ onCapture, disabled }: PhotoCaptureProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;

    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      setPreview(compressed);
      onCapture(compressed);
    } catch {
      // Fallback: use raw
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setPreview(result);
        onCapture(result);
      };
      reader.readAsDataURL(file);
    } finally {
      setCompressing(false);
    }
  }

  function clear() {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        disabled={disabled}
      />

      {preview ? (
        <div className="relative overflow-hidden sf-card">
          <img
            src={preview}
            alt="Food preview"
            className="w-full h-48 object-cover"
          />
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center text-foreground/60 hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={disabled || compressing}
            className={cn(
              "sf-card p-6 flex flex-col items-center gap-2 cursor-pointer",
              "hover:border-crimson/30",
              disabled && "opacity-40 cursor-not-allowed"
            )}
          >
            <Camera size={24} className="text-crimson" />
            <span className="font-display text-[10px] tracking-widest text-foreground/50">
              CAMERA
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              // Create a non-capture input for gallery
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleFile(file);
              };
              input.click();
            }}
            disabled={disabled || compressing}
            className={cn(
              "sf-card p-6 flex flex-col items-center gap-2 cursor-pointer",
              "hover:border-crimson/30",
              disabled && "opacity-40 cursor-not-allowed"
            )}
          >
            <ImagePlus size={24} className="text-crimson" />
            <span className="font-display text-[10px] tracking-widest text-foreground/50">
              GALLERY
            </span>
          </button>
        </div>
      )}

      {compressing && (
        <p className="text-center text-[11px] text-foreground/30 font-display tracking-wider animate-pulse">
          COMPRESSING...
        </p>
      )}
    </div>
  );
}
