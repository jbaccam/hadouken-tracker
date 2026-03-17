import { getOpenAI } from "./client";
import { TEXT_PROMPT } from "./prompts";
import type { AnalysisResult } from "@/types/nutrition";

export async function analyzeText(text: string): Promise<AnalysisResult> {
  const response = await getOpenAI().chat.completions.create({
    model: "gemini-2.5-flash",
    max_tokens: 2048,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: TEXT_PROMPT },
      { role: "user", content: text },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  return JSON.parse(content) as AnalysisResult;
}
