import type { NutritionItem } from "@/types/nutrition";

export type UserRole = "admin" | "friend" | "free";

export interface Profile {
  id: string;
  role: UserRole;
  calorie_goal: number;
  protein_goal: number;
  carb_goal: number;
  fat_goal: number;
  ai_requests_today: number;
  ai_requests_date: string;
  created_at: string;
  updated_at: string;
}

export interface FoodEntry {
  id: string;
  user_id: string;
  date: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  serving_size: string | null;
  source_type: "photo" | "text" | "manual";
  ai_confidence: number | null;
  ai_raw_response: Record<string, unknown> | null;
  created_at: string;
}

export interface SavedRecipe {
  id: string;
  user_id: string;
  name: string;
  items: NutritionItem[];
  total_weight_grams: number | null;
  servings: number;
  created_at: string;
  updated_at: string;
}

export type InsertFoodEntry = Omit<FoodEntry, "id" | "created_at" | "user_id">;
export type UpdateFoodEntry = Partial<InsertFoodEntry> & { id: string };
export type InsertSavedRecipe = Omit<
  SavedRecipe,
  "id" | "created_at" | "updated_at" | "user_id"
>;
export type UpdateSavedRecipe = Partial<InsertSavedRecipe> & { id: string };
