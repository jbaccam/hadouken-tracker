export interface NutritionItem {
  name: string;
  serving_size: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
}

export interface AnalysisResult {
  rejected: boolean;
  reason: string | null;
  items: NutritionItem[];
  confidence: number;
  notes: string | null;
}
