"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Save,
  LogOut,
  Loader2,
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Target,
  Sun,
  Moon,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useProfile, useUpdateProfile } from "@/lib/hooks/useProfile";
import { cn } from "@/lib/utils/cn";

interface AdminUser {
  id: string;
  email: string;
  role: "admin" | "friend" | "free";
  ai_requests_today: number;
  ai_requests_date: string;
  created_at: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [goals, setGoals] = useState({
    calorie_goal: 2000,
    protein_goal: 150,
    carb_goal: 250,
    fat_goal: 65,
  });
  const [goalsDirty, setGoalsDirty] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // Admin state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [togglingUser, setTogglingUser] = useState<string | null>(null);

  useEffect(() => {
    // Read theme from html class on mount
    const isLight = document.documentElement.classList.contains("light");
    setIsDark(!isLight);
  }, []);

  useEffect(() => {
    if (profile) {
      setGoals({
        calorie_goal: profile.calorie_goal,
        protein_goal: profile.protein_goal,
        carb_goal: profile.carb_goal,
        fat_goal: profile.fat_goal,
      });
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.role === "admin") {
      loadUsers();
    }
  }, [profile?.role]);

  function toggleTheme() {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove("dark");
      html.classList.add("light");
      setIsDark(false);
      localStorage.setItem("theme", "light");
    } else {
      html.classList.remove("light");
      html.classList.add("dark");
      setIsDark(true);
      localStorage.setItem("theme", "dark");
    }
  }

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        setUsers(await res.json());
      }
    } finally {
      setLoadingUsers(false);
    }
  }

  function handleGoalChange(key: keyof typeof goals, value: string) {
    setGoals((prev) => ({ ...prev, [key]: Number(value) || 0 }));
    setGoalsDirty(true);
  }

  async function saveGoals() {
    updateProfile.mutate(goals, {
      onSuccess: () => {
        toast.success("Goals updated!");
        setGoalsDirty(false);
      },
      onError: () => toast.error("Failed to update goals"),
    });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  async function toggleRole(userId: string, currentRole: string) {
    const newRole = currentRole === "friend" ? "free" : "friend";
    setTogglingUser(userId);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole as "friend" | "free" } : u))
        );
        toast.success(`Role updated to ${newRole}`);
      } else {
        toast.error("Failed to update role");
      }
    } finally {
      setTogglingUser(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-foreground/30" size={24} />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-lg tracking-wider text-deep-violet mb-6"
        style={{ textShadow: "0 0 10px rgba(156, 39, 176, 0.4)" }}
      >
        CONFIG
      </motion.h1>

      {/* Theme toggle */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.02 }}
        className="sf-card p-4 pl-5 mb-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isDark ? (
              <Moon size={14} className="text-foreground/50" />
            ) : (
              <Sun size={14} className="text-ember" />
            )}
            <span className="font-display text-[11px] tracking-widest text-foreground/50 uppercase sf-text-stroke">
              Theme
            </span>
          </div>
          <button
            onClick={toggleTheme}
            className="sf-btn px-4 py-2 font-display text-[10px] tracking-widest text-foreground/60 hover:text-foreground"
          >
            {isDark ? "LIGHT MODE" : "DARK MODE"}
          </button>
        </div>
      </motion.section>

      {/* Goals section */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="sf-card p-4 pl-5 mb-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Target size={14} className="text-deep-violet" />
          <h2 className="font-display text-[11px] tracking-widest text-foreground/50 uppercase sf-text-stroke">
            Daily Goals
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { key: "calorie_goal" as const, label: "Calories", color: "text-calories", suffix: "" },
            { key: "protein_goal" as const, label: "Protein", color: "text-protein", suffix: "g" },
            { key: "carb_goal" as const, label: "Carbs", color: "text-carbs", suffix: "g" },
            { key: "fat_goal" as const, label: "Fat", color: "text-fat", suffix: "g" },
          ].map(({ key, label, color, suffix }) => (
            <div key={key} className="space-y-1.5">
              <label className={cn("font-display text-[9px] tracking-widest uppercase", color)}>
                {label} {suffix && `(${suffix})`}
              </label>
              <input
                type="number"
                value={goals[key]}
                onChange={(e) => handleGoalChange(key, e.target.value)}
                min={0}
                className="w-full sf-input py-2.5 px-3 text-sm tabular-nums"
              />
            </div>
          ))}
        </div>

        {goalsDirty && (
          <motion.button
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={saveGoals}
            disabled={updateProfile.isPending}
            className="sf-btn mt-4 w-full py-2.5 bg-deep-violet font-display text-xs tracking-widest text-white sf-text-stroke hover:brightness-110 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {updateProfile.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            SAVE GOALS
          </motion.button>
        )}
      </motion.section>

      {/* Account section */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="sf-card p-4 pl-5 mb-4"
      >
        <h2 className="font-display text-[11px] tracking-widest text-foreground/50 uppercase mb-3 sf-text-stroke">
          Account
        </h2>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-foreground/40">Role</span>
          <span className="font-display text-[10px] tracking-wider text-crimson uppercase">
            {profile?.role}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="sf-btn w-full py-2.5 bg-crimson/20 font-display text-xs tracking-widest text-crimson hover:bg-crimson/30 flex items-center justify-center gap-2"
        >
          <LogOut size={14} />
          SIGN OUT
        </button>
      </motion.section>

      {/* Admin Panel */}
      {profile?.role === "admin" && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="sf-card p-4 pl-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users size={14} className="text-deep-violet" />
            <h2 className="font-display text-[11px] tracking-widest text-deep-violet uppercase">
              Admin — User Management
            </h2>
          </div>

          {loadingUsers ? (
            <div className="flex justify-center py-6">
              <Loader2 size={20} className="animate-spin text-foreground/30" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-xs text-foreground/30 text-center py-4">No users found</p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => {
                const isMe = user.id === profile?.id;
                const RoleIcon =
                  user.role === "admin"
                    ? ShieldAlert
                    : user.role === "friend"
                    ? ShieldCheck
                    : Shield;

                return (
                  <div
                    key={user.id}
                    className={cn(
                      "flex items-center justify-between py-2.5 px-3 bg-[#0d0d12] border border-[#2a2a35]",
                      isMe && "border-deep-violet/30"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <RoleIcon
                        size={14}
                        className={cn(
                          user.role === "admin"
                            ? "text-crimson"
                            : user.role === "friend"
                            ? "text-power-green"
                            : "text-foreground/30"
                        )}
                      />
                      <div className="min-w-0">
                        <p className="text-xs truncate">{user.email}</p>
                        <p className="text-[10px] text-foreground/30">
                          AI: {user.ai_requests_today}/30 today
                        </p>
                      </div>
                    </div>

                    {!isMe && user.role !== "admin" && (
                      <button
                        onClick={() => toggleRole(user.id, user.role)}
                        disabled={togglingUser === user.id}
                        className={cn(
                          "sf-btn px-3 py-1.5 text-[10px] font-display tracking-wider",
                          user.role === "friend"
                            ? "bg-crimson/20 text-crimson"
                            : "bg-power-green/20 text-power-green"
                        )}
                      >
                        {togglingUser === user.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : user.role === "friend" ? (
                          "REVOKE"
                        ) : (
                          "PROMOTE"
                        )}
                      </button>
                    )}

                    {isMe && (
                      <span className="text-[9px] font-display tracking-wider text-foreground/20">
                        YOU
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.section>
      )}
    </div>
  );
}
