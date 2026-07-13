"use client";

import { animate, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Shared motion + design kit for Work mode. Brand jade, ops-dashboard
// density, motion tier ~7 (staggered entrances, count-up, spring hovers),
// all reduced-motion aware. Pulled from ui-ux-pro-max design guidance.

export const EASE = [0.22, 1, 0.36, 1] as const;
export const JADE = "#3D9E77";
export const JADE_BTN = "bg-[#3D9E77] hover:bg-[#348A67] text-white";

/** Reliability tone by score: jade / amber / red / muted. */
export function scoreTone(score: number | null): { hex: string; text: string; label: string } {
  if (score === null) return { hex: "#9CA3AF", text: "text-muted-foreground", label: "No history" };
  if (score >= 90) return { hex: JADE, text: "text-[#3D9E77]", label: "On track" };
  if (score >= 70) return { hex: "#F59E0B", text: "text-amber-600 dark:text-amber-400", label: "Watch" };
  return { hex: "#EF4444", text: "text-red-600 dark:text-red-400", label: "Behind" };
}

/** Number that counts up from 0 on mount; instant under reduced motion. */
export function CountUp({ value, suffix = "", duration = 0.9 }: {
  value: number; suffix?: string; duration?: number;
}) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) {
      const id = requestAnimationFrame(() => setN(value));
      return () => cancelAnimationFrame(id);
    }
    const c = animate(0, value, { duration, ease: EASE, onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [value, reduce, duration]);
  return <span className="tabular-nums">{n}{suffix}</span>;
}

/** Circular reliability gauge that draws itself in. */
export function Ring({ score, size = 46 }: { score: number | null; size?: number }) {
  const reduce = useReducedMotion();
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = score ?? 0;
  const tone = scoreTone(score);
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
          className="stroke-muted-foreground/20" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone.hex} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: reduce ? offset : c }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: EASE }} />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-heading text-[12px] font-bold tabular-nums"
        style={{ color: tone.hex }}>
        {score === null ? "—" : pct}
      </span>
    </div>
  );
}

/** Thin animated load/progress bar. */
export function LoadBar({ value, max, tone = JADE }: { value: number; max: number; tone?: string }) {
  const reduce = useReducedMotion();
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted-foreground/15">
      <motion.div className="h-full rounded-full" style={{ backgroundColor: tone }}
        initial={{ width: reduce ? `${pct}%` : 0 }}
        whileInView={{ width: `${pct}%` }} viewport={{ once: true }}
        transition={{ duration: 0.9, ease: EASE }} />
    </div>
  );
}

/** Scroll-reveal wrapper: fade + rise, staggerable via index. */
export function Reveal({ children, i = 0, className }: {
  children: React.ReactNode; i?: number; className?: string;
}) {
  return (
    <motion.div className={className}
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease: EASE, delay: i * 0.04 }}>
      {children}
    </motion.div>
  );
}

/** Card surface — dense dashboard styling shared by all Work screens. */
export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>
      {children}
    </div>
  );
}

/** A pressable that scales slightly on tap (scale-feedback rule). */
export function Press({ children, className, onClick, disabled, type = "button", title, ariaLabel }: {
  children?: React.ReactNode; className?: string; onClick?: () => void; disabled?: boolean;
  type?: "button" | "submit"; title?: string; ariaLabel?: string;
}) {
  return (
    <motion.button type={type} onClick={onClick} disabled={disabled} title={title} aria-label={ariaLabel}
      whileTap={disabled ? undefined : { scale: 0.96 }} transition={{ duration: 0.12 }}
      className={className}>
      {children}
    </motion.button>
  );
}
