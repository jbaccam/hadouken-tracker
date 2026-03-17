"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  SavedRecipe,
  InsertSavedRecipe,
  UpdateSavedRecipe,
} from "@/types/database";

async function fetchRecipes(): Promise<SavedRecipe[]> {
  const res = await fetch("/api/recipes");
  if (!res.ok) throw new Error("Failed to fetch recipes");
  return res.json();
}

async function createRecipe(recipe: InsertSavedRecipe): Promise<SavedRecipe> {
  const res = await fetch("/api/recipes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(recipe),
  });
  if (!res.ok) throw new Error("Failed to create recipe");
  return res.json();
}

async function updateRecipe(recipe: UpdateSavedRecipe): Promise<SavedRecipe> {
  const res = await fetch("/api/recipes", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(recipe),
  });
  if (!res.ok) throw new Error("Failed to update recipe");
  return res.json();
}

async function deleteRecipe(id: string): Promise<void> {
  const res = await fetch(`/api/recipes?id=${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete recipe");
}

export function useRecipes() {
  return useQuery({
    queryKey: ["recipes"],
    queryFn: fetchRecipes,
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}
