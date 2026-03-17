"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Profile } from "@/types/database";

async function fetchProfile(): Promise<Profile> {
  const res = await fetch("/api/profile");
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

async function updateProfile(
  goals: Partial<Pick<Profile, "calorie_goal" | "protein_goal" | "carb_goal" | "fat_goal">>
): Promise<Profile> {
  const res = await fetch("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(goals),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(["profile"], data);
    },
  });
}
