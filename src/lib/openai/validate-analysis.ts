import { z } from "zod";
import type { AnalysisResult } from "@/types/nutrition";

const nonNegativeNumber = z.number().finite().min(0);

const nutritionItemSchema = z
  .object({
    name: z.string().trim().min(1),
    serving_size: z.string().trim().min(1),
    calories: nonNegativeNumber,
    protein: nonNegativeNumber,
    carbs: nonNegativeNumber,
    fat: nonNegativeNumber,
    fiber: nonNegativeNumber.nullable(),
    sugar: nonNegativeNumber.nullable(),
    sodium: nonNegativeNumber.nullable(),
  })
  .strict();

const analysisResultSchema = z
  .object({
    rejected: z.boolean(),
    reason: z.string().trim().min(1).nullable(),
    items: z.array(nutritionItemSchema),
    confidence: z.number().finite().min(0).max(1),
    notes: z.string().trim().min(1).nullable(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.rejected) {
      if (value.reason === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["reason"],
          message: "reason must be set when rejected is true",
        });
      }
      if (value.items.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items"],
          message: "items must be empty when rejected is true",
        });
      }
    } else {
      if (value.reason !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["reason"],
          message: "reason must be null when rejected is false",
        });
      }
      if (value.items.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items"],
          message: "items must contain at least one item when rejected is false",
        });
      }
    }
  });

export function validateAnalysisResult(data: unknown): AnalysisResult {
  const parsed = analysisResultSchema.safeParse(data);
  if (!parsed.success) {
    const details = parsed.error.issues
      .slice(0, 3)
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join("; ");

    throw new Error(`AI response failed schema validation: ${details}`);
  }

  return parsed.data;
}
