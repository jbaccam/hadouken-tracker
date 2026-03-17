import { AuthForm } from "@/components/auth/AuthForm";

export const dynamic = "force-dynamic";

export default function AuthPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 relative">
      {/* Dramatic radial spotlight behind title */}
      <div
        className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[500px] h-[300px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(211,47,47,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Arcade title */}
      <div className="text-center mb-10 relative">
        {/* Decorative lines above */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(211,47,47,0.4))" }} />
          <div className="w-2 h-2 rotate-45 bg-crimson/30" />
          <div className="w-12 h-[1px]" style={{ background: "linear-gradient(-90deg, transparent, rgba(211,47,47,0.4))" }} />
        </div>

        <h1 className="font-display text-5xl tracking-wider text-metallic mb-2">
          HADOUKEN
        </h1>
        <p className="font-display text-sm tracking-[0.4em] text-foreground/40 uppercase">
          Macro Tracker
        </p>

        {/* Decorative lines below */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <div className="w-16 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(211,47,47,0.3))" }} />
          <div className="w-1.5 h-1.5 rotate-45 bg-crimson/30" />
          <div className="w-16 h-[1px]" style={{ background: "linear-gradient(-90deg, transparent, rgba(211,47,47,0.3))" }} />
        </div>
      </div>

      <AuthForm />

      {/* Decorative bottom text */}
      <div className="mt-12 flex items-center gap-3">
        <div className="w-8 h-[1px] bg-foreground/10" />
        <p className="text-[11px] text-foreground/20 font-display tracking-widest uppercase">
          Insert Coin to Continue
        </p>
        <div className="w-8 h-[1px] bg-foreground/10" />
      </div>
    </div>
  );
}
