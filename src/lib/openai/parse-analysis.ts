import type { AnalysisResult } from "@/types/nutrition";
import { validateAnalysisResult } from "./validate-analysis";

function normalizeJsonLikeContent(content: string): string {
  let normalized = content.trim();

  const fencedMatch = normalized.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    normalized = fencedMatch[1].trim();
  }

  const objectStart = normalized.indexOf("{");
  const objectEnd = normalized.lastIndexOf("}");
  if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
    normalized = normalized.slice(objectStart, objectEnd + 1);
  }

  normalized = normalized
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/(:\s*)(-?)\.(\d+)/g, (_match, prefix, sign, fraction) => {
      return `${prefix}${sign}0.${fraction}`;
    });

  return normalized;
}

export function parseAnalysisResult(content: string): AnalysisResult {
  try {
    return validateAnalysisResult(JSON.parse(content));
  } catch {
    const repaired = normalizeJsonLikeContent(content);
    return validateAnalysisResult(JSON.parse(repaired));
  }
}
