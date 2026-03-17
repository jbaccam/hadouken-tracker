"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FoodEntry, InsertFoodEntry, UpdateFoodEntry } from "@/types/database";

function todayDate() {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local timezone
}

async function fetchEntries(date: string): Promise<FoodEntry[]> {
  const res = await fetch(`/api/entries?date=${date}`);
  if (!res.ok) throw new Error("Failed to fetch entries");
  return res.json();
}

async function createEntry(entry: InsertFoodEntry): Promise<FoodEntry> {
  const res = await fetch("/api/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error("Failed to create entry");
  return res.json();
}

async function updateEntry(entry: UpdateFoodEntry): Promise<FoodEntry> {
  const res = await fetch("/api/entries", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error("Failed to update entry");
  return res.json();
}

async function deleteEntry(id: string): Promise<void> {
  const res = await fetch(`/api/entries?id=${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete entry");
}

export function useEntries(date?: string) {
  const d = date || todayDate();
  return useQuery({
    queryKey: ["entries", d],
    queryFn: () => fetchEntries(d),
  });
}

export function useCreateEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
  });
}

export function useUpdateEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
  });
}

export function useDeleteEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
  });
}
