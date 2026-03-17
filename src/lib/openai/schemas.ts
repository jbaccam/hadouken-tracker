export const nutritionSchema = {
  name: "nutrition_analysis",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      rejected: {
        type: "boolean" as const,
        description: "True if the input is not food-related",
      },
      reason: {
        type: ["string", "null"] as const,
        description: "Rejection reason if rejected, e.g. 'not_food'",
      },
      items: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            name: { type: "string" as const },
            serving_size: { type: "string" as const },
            calories: { type: "number" as const },
            protein: { type: "number" as const },
            carbs: { type: "number" as const },
            fat: { type: "number" as const },
            fiber: { type: ["number", "null"] as const },
            sugar: { type: ["number", "null"] as const },
            sodium: { type: ["number", "null"] as const },
          },
          required: ["name", "serving_size", "calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium"],
          additionalProperties: false,
        },
      },
      confidence: {
        type: "number" as const,
        description: "0.0-1.0 confidence score",
      },
      notes: {
        type: ["string", "null"] as const,
        description: "Brief note about estimation method",
      },
    },
    required: ["rejected", "reason", "items", "confidence", "notes"],
    additionalProperties: false,
  },
};
