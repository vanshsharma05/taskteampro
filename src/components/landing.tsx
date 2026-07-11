"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/brand-logo";

/**
 * The homescreen is one scroll story. "TeamTaskPro" contains its own three
 * features — Team · Task · Pro — so the name opens alone on screen, and as
 * you scroll the other letters drift away while each embedded word takes
 * the spotlight, then the name reassembles for the call to action.
 */

const NAME = ["T", "e", "a", "m", "T", "a", "s", "k", "P", "r", "o"] as const;

const SEGMENTS = [
  {
    start: 0, end: 3, center: 1.5,
    headline: "Hand it off. Watch it land.",
    sub: "Assign work with real accountability — see who's on it, and when it'll be done.",
  },
  {
    start: 4, end: 7, center: 5.5,
    headline: "Say it once. It's scheduled.",
    sub: "Type or speak a sentence — date, time, repeat and reminders set themselves, synced to Google Calendar.",
  },
  {
    start: 8, end: 10, center: 9,
    headline: "It learns your real pace.",
    sub: "Your estimates vs. reality, time you owe, and a week forecast that warns you before Thursday melts down.",
  },
];

// scroll timeline: hero → Team → Task → Pro → reassembled name + CTA
const T = [0, 0.10, 0.16, 0.30, 0.42, 0.56, 0.68, 0.82, 0.92, 1];

// deterministic scatter for letters not in the spotlight (em units)
const SCATTER = [
  { x: -3.2, y: -1.4 }, { x: 2.6, y: 1.8 }, { x: -1.8, y: -2.2 }, { x: 3.4, y: 1.2 },
  { x: -2.8, y: 2.0 }, { x: 1.9, y: -1.6 }, { x: 3.1, y: 1.5 }, { x: -3.6, y: -1.1 },
  { x: 2.2, y: -1.9 }, { x: -2.4, y: 1.4 }, { x: 3.0, y: -1.2 },
];

const NAME_CENTER = 5; // visual middle of the 11 letters

function groupOf(i: number): number {
  return i <= 3 ? 0 : i <= 7 ? 1 : 2;
}

/** Per-phase value: neutral in hero/end, gathered when its word is active, scattered otherwise. */
function keyframes<V>(i: number, neutral: V, active: V, scattered: V): V[] {
  const g = groupOf(i);
  const at = (phase: number) => (g === phase ? active : scattered);
  //         0        .10      .16         .30         .42         .56         .68         .82         .92      1
  return [neutral, neutral, at(0), at(0), at(1), at(1), at(2), at(2), neutral, neutral];
}

function ScrollLetter({ i, progress }: { i: number; progress: MotionValue<number> }) {
  const g = groupOf(i);
  const gatherX = `${(NAME_CENTER - SEGMENTS[g].center) * 0.62}em`;

  const x = useTransform(progress, T, keyframes(i, "0em", gatherX, `${SCATTER[i].x}em`));
  const y = useTransform(progress, T, keyframes(i, "0em", "-0.15em", `${SCATTER[i].y}em`));
  const opacity = useTransform(progress, T, keyframes(i, 1, 1, 0.05));
  const scale = useTransform(progress, T, keyframes(i, 1, 1.14, 0.9));
  const blurPx = useTransform(progress, T, keyframes(i, 0, 0, 6));
  const filter = useTransform(blurPx, (b) => `blur(${b}px)`);

  return (
    <motion.span style={{ x, y, opacity, scale, filter }}
      className={cn("inline-block", i >= 8 && "text-emerald-500")}>
      {NAME[i]}
    </motion.span>
  );
}

function FeatureCopy({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const w0 = T[2 + index * 2], w1 = T[3 + index * 2];
  const opacity = useTransform(progress, [w0 - 0.03, w0 + 0.03, w1 - 0.03, w1 + 0.03], [0, 1, 1, 0]);
  const y = useTransform(progress, [w0 - 0.03, w0 + 0.03, w1 + 0.03], [24, 0, -12]);
  const seg = SEGMENTS[index];
  return (
    <motion.div style={{ opacity, y }}
      className="pointer-events-none absolute inset-x-6 bottom-[18vh] mx-auto max-w-md text-center">
      <p className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">{seg.headline}</p>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{seg.sub}</p>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
        {index + 1} / 3
      </p>
    </motion.div>
  );
}

export function Landing() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // chrome fades in once the story starts; the hero is just the name
  const navOpacity = useTransform(scrollYProgress, [0.02, 0.08], [0, 1]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.06], [1, 0]);
  const ctaOpacity = useTransform(scrollYProgress, [0.88, 0.95], [0, 1]);
  const ctaEvents = useTransform(ctaOpacity, (o) => (o > 0.5 ? "auto" : "none")) as MotionValue<"auto" | "none">;

  // the brand dial turns slowly behind everything — barely there
  const dialRotate = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const dialOpacity = useTransform(scrollYProgress, [0, 0.1, 0.85, 1], [0, 0.06, 0.06, 0]);

  return (
    <div className="bg-background text-foreground">
      {/* minimal chrome, hidden on the opening frame */}
      <motion.header style={{ opacity: navOpacity }}
        className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-4">
        <LogoMark className="size-8 rounded-lg shadow-sm ring-1 ring-white/10" />
        <Link href="/login" className="rounded-full border border-border bg-background/70 px-4 py-1.5 text-sm font-semibold backdrop-blur transition hover:bg-muted">
          Log in
        </Link>
      </motion.header>

      <div ref={ref} className="relative h-[520vh]">
        <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">

          {/* ambient dial — the logo's geometry at architectural scale */}
          <motion.div aria-hidden style={{ rotate: dialRotate, opacity: dialOpacity }}
            className="pointer-events-none absolute size-[130vmin] rounded-full border-[3px] border-foreground">
            <div className="absolute left-1/2 top-[7%] size-3 -translate-x-1/2 rounded-full bg-foreground" />
          </motion.div>

          {/* the name — every phase is these same eleven letters */}
          <h1 className="flex select-none font-heading font-bold tracking-tight"
            style={{ fontSize: "clamp(2.6rem, 12.5vw, 10rem)" }}>
            {NAME.map((_, i) => <ScrollLetter key={i} i={i} progress={scrollYProgress} />)}
          </h1>

          {/* feature copy, one per spotlight */}
          {SEGMENTS.map((_, i) => <FeatureCopy key={i} index={i} progress={scrollYProgress} />)}

          {/* opening frame: nothing but the name and a whisper to scroll */}
          <motion.div style={{ opacity: hintOpacity }}
            className="pointer-events-none absolute bottom-10 flex flex-col items-center gap-1 text-muted-foreground/60">
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em]">Scroll</span>
            <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
              <ChevronDown className="size-4" />
            </motion.span>
          </motion.div>

          {/* the end: name reassembled, one ask */}
          <motion.div style={{ opacity: ctaOpacity, pointerEvents: ctaEvents }}
            className="absolute inset-x-6 bottom-[12vh] flex flex-col items-center gap-4">
            <p className="text-[15px] text-muted-foreground">One app. All three.</p>
            <div className="flex items-center gap-3">
              <Link href="/signup"
                className="rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-sm transition hover:bg-foreground/90 active:scale-[0.98]">
                Get started free
              </Link>
              <Link href="/login"
                className="rounded-full border border-border px-6 py-3 text-sm font-semibold transition hover:bg-muted">
                Log in
              </Link>
            </div>
            <p className="mt-6 flex items-center gap-3 text-[12px] text-muted-foreground/60">
              <span>© {new Date().getFullYear()} TeamTaskPro</span>
              <Link href="/privacy" className="transition hover:text-foreground">Privacy</Link>
              <Link href="/terms" className="transition hover:text-foreground">Terms</Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
