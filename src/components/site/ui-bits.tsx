import { motion, useInView, useReducedMotion, animate } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BadgeCheck, TrendingUp } from "lucide-react";
import type { Person } from "@/lib/demo-people";

export function FadeUp({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function LiftCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`glass ${className}`}
      whileHover={reduce ? {} : { y: -4, rotateX: 1.5, rotateY: -1.5, boxShadow: "var(--shadow-lift)" }}
      whileTap={reduce ? {} : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      style={{ transformPerspective: 900 }}
    >
      {children}
    </motion.div>
  );
}

export function CountUp({ to, format = (n: number) => Math.round(n).toLocaleString("en-IN") }: { to: number; format?: ((n: number) => string) | undefined }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration: 1.6, ease: "easeOut", onUpdate: setVal });
    return () => c.stop();
  }, [inView, to]);
  return <span ref={ref} className="tabular">{format(val)}</span>;
}

export function MatchRing({ value, size = 48 }: { value: number; size?: number }) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ai-tint)" strokeWidth="4" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ai)" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value / 100) }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-xs font-bold text-ai-text tabular">{Math.round(value)}%</span>
    </div>
  );
}

export function VerifiedPill() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary-tint px-2 py-0.5 text-[11px] font-semibold text-primary">
      <BadgeCheck className="h-3 w-3" /> Verified
    </span>
  );
}

export function PersonCard({ p }: { p: Person }) {
  return (
    <LiftCard className="flex items-center gap-4 p-4">
      <div className="rounded-full bg-signature p-[2px]">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-card font-display text-sm font-bold text-foreground">
          {p.initials}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display font-bold text-foreground">{p.role}</span>
          {p.verified && <VerifiedPill />}
          {p.community && (
            <span className="rounded-full bg-community-tint px-2 py-0.5 text-[11px] font-semibold text-primary">Community</span>
          )}
          {p.rising && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ai-tint px-2 py-0.5 text-[11px] font-semibold text-ai-text">
              <TrendingUp className="h-3 w-3" /> Rising
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-hint">{p.city} · {p.reason}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {p.skills.map((s) => (
            <span key={s} className="rounded-lg bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">{s}</span>
          ))}
        </div>
      </div>
      <MatchRing value={p.score} />
    </LiftCard>
  );
}
