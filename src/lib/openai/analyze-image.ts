import { getOpenAI } from "./client";
import { IMAGE_PROMPT } from "./prompts";
import type { AnalysisResult } from "@/types/nutrition";

export async function analyzeImage(base64Image: string): Promise<AnalysisResult> {
  const response = await getOpenAI().chat.completions.create({
    model: "gemini-2.5-flash",
    max_tokens: 2048,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: IMAGE_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: base64Image.startsWith("data:")
                ? base64Image
                : `data:image/jpeg;base64,${base64Image}`,
              detail: "high",
            },
          },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  return JSON.parse(content) as AnalysisResult;
}
