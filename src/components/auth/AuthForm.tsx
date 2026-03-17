"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Mail, Lock, Eye, EyeOff, Ticket } from "lucide-react";
import { toast } from "sonner";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const inviteCode = searchParams.get("invite");
  const hasInvite = Boolean(inviteCode);

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failures, setFailures] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [inviteValid, setInviteValid] = useState<boolean | null>(null);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  useEffect(() => {
    if (!hasInvite || !inviteCode) {
      setInviteValid(null);
      return;
    }

    let cancelled = false;
    setMode("signup");
    setInviteValid(null);

    fetch(`/api/invites/validate?code=${encodeURIComponent(inviteCode)}`)
      .then((res) => res.json())
      .then((data: { valid?: boolean }) => {
        if (!cancelled) {
          setInviteValid(Boolean(data.valid));
        }
      })
      .catch(() => {
        if (!cancelled) setInviteValid(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasInvite, inviteCode]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (loading || isLocked) return;

      setLoading(true);

      try {
        if (mode === "login") {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) {
            const newFailures = failures + 1;
            setFailures(newFailures);
            if (newFailures >= 5) {
              setLockedUntil(Date.now() + 30_000);
              setFailures(0);
              toast.error("Too many attempts. Wait 30 seconds.");
            } else {
              toast.error(error.message);
            }
            return;
          }
        } else {
          if (hasInvite && inviteValid !== true) {
            toast.error("Invite link is invalid or already used.");
            return;
          }

          const { error } = await supabase.auth.signUp({ email, password });
          if (error) {
            toast.error(error.message);
            return;
          }

          if (hasInvite && inviteCode) {
            const redeemRes = await fetch("/api/invites/redeem", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code: inviteCode }),
            });

            if (!redeemRes.ok) {
              const payload = (await redeemRes.json().catch(() => ({}))) as { error?: string };
              toast.error(payload.error || "Failed to redeem invite link");
              return;
            }
          }

          toast.success("Account created! Logging in...");
        }

        setFailures(0);
        setLockedUntil(null);
        router.push("/");
        router.refresh();
      } finally {
        setLoading(false);
      }
    },
    [
      email,
      password,
      mode,
      loading,
      isLocked,
      failures,
      supabase,
      router,
      hasInvite,
      inviteCode,
      inviteValid,
    ]
  );

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-5 relative"
    >
      {hasInvite ? (
        <div className="sf-card p-3 pl-4">
          <div className="flex items-center gap-2">
            <Ticket size={14} className="text-power-green" />
            <span className="font-display text-[10px] tracking-widest text-power-green uppercase">
              Friend Invite
            </span>
          </div>
          <p className="text-[11px] text-foreground/45 mt-2">
            Create your account to join with friend access.
          </p>
          {inviteValid === false && (
            <p className="text-[11px] text-crimson mt-2">
              This invite link is invalid or already used.
            </p>
          )}
          {inviteValid === null && (
            <p className="text-[11px] text-foreground/30 mt-2">Checking invite...</p>
          )}
        </div>
      ) : (
        <div className="flex overflow-hidden solid-panel">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 py-3 font-display text-xs tracking-widest uppercase transition-all duration-200",
                mode === m
                  ? "bg-crimson/20 text-crimson text-glow-crimson-soft"
                  : "text-foreground/40 hover:text-foreground/60"
              )}
            >
              {m === "login" ? "PLAYER LOGIN" : "NEW CHALLENGER"}
            </button>
          ))}
        </div>
      )}

      {/* Email */}
      <div className="space-y-2">
        <label className="font-display text-[10px] tracking-widest text-foreground/50 uppercase">
          Email
        </label>
        <div className="relative">
          <Mail
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="fighter@arena.com"
            className="w-full sf-input py-3 pl-10 pr-4 text-sm"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <label className="font-display text-[10px] tracking-widest text-foreground/50 uppercase">
          Password
        </label>
        <div className="relative">
          <Lock
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30"
          />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="••••••••"
            className="w-full sf-input py-3 pl-10 pr-11 text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Submit */}
      <AnimatePresence mode="wait">
        <motion.button
          key={mode}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          type="submit"
          disabled={loading || isLocked || (hasInvite && mode === "signup" && inviteValid !== true)}
          className={cn(
            "sf-btn w-full py-3.5 font-display text-sm tracking-widest uppercase relative overflow-hidden",
            "bg-crimson text-white sf-text-stroke",
            "hover:brightness-110",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
          )}
        >
          {/* Shimmer effect on button */}
          <div className="shimmer absolute inset-0 pointer-events-none" />
          <span className="relative">
            {loading ? (
              <Loader2 size={18} className="animate-spin mx-auto" />
            ) : isLocked ? (
              "LOCKED — WAIT"
            ) : mode === "login" ? (
              "FIGHT!"
            ) : (
              "JOIN THE ARENA"
            )}
          </span>
        </motion.button>
      </AnimatePresence>
    </motion.form>
  );
}
