"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Mic, Sun, CloudSun, AlertTriangle, Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Homepage v2 — built from the designer's spec. Light theme per the delivered
 * comps; dark is a derived variant pending the designer's dark pass.
 * Motion system: every structural animation uses cubic-bezier(0.22,1,0.36,1),
 * scroll reveals fade+rise 30px over 800ms at 15% visibility.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

const reveal = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

function Reveal({ children, className, delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  return (
    <motion.div className={className} initial="hidden" whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={{ hidden: reveal.hidden, show: { ...reveal.show, transition: { ...reveal.show.transition, delay } } }}>
      {children}
    </motion.div>
  );
}

/* ---------------------------------- nav ---------------------------------- */

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur dark:border-white/5 dark:bg-neutral-950/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        {/* text-only logo per design note — no mark in the nav */}
        <Link href="/" className="font-heading text-lg font-semibold tracking-tight">
          TeamTask<span className="text-emerald-600 dark:text-emerald-400">Pro</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-neutral-600 md:flex dark:text-neutral-300">
          <a href="#task" className="transition-colors hover:text-neutral-950 dark:hover:text-white">Product</a>
          <a href="#team" className="transition-colors hover:text-neutral-950 dark:hover:text-white">Use cases</a>
        </nav>
        <div className="flex items-center gap-2.5">
          <Link href="/login"
            className="flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-neutral-700 transition-colors hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white">
            Log in
          </Link>
          <Link href="/signup"
            className="flex min-h-11 items-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ---------------------------------- hero --------------------------------- */

function AppMock() {
  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl shadow-black/5 dark:border-white/10 dark:bg-neutral-900">
        {/* browser chrome */}
        <div className="flex items-center gap-2 border-b border-black/5 px-4 py-2.5 dark:border-white/5">
          <span className="size-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          <span className="size-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          <span className="size-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          <div className="ml-3 h-5 flex-1 rounded-md bg-neutral-100 dark:bg-neutral-800" />
        </div>
        <div className="flex">
          {/* mini sidebar */}
          <div className="hidden w-32 shrink-0 border-r border-black/5 p-3 sm:block dark:border-white/5">
            <div className="mb-4 flex size-6 items-center justify-center rounded-md bg-neutral-950 dark:bg-white">
              <Check className="size-3.5 text-emerald-400 dark:text-emerald-600" strokeWidth={3} />
            </div>
            {["Today", "Upcoming", "Calendar", "Settings"].map((l, i) => (
              <div key={l} className={cn("mb-1 rounded-md px-2 py-1.5 text-[11px] font-medium",
                i === 0 ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white" : "text-neutral-400 dark:text-neutral-500")}>
                {l}
              </div>
            ))}
          </div>
          {/* content */}
          <div className="flex flex-1 gap-4 p-4">
            <div className="min-w-0 flex-1">
              <p className="mb-3 font-heading text-sm font-bold">Today</p>
              {[
                { t: "Pay electricity bill", m: "5:15 PM IST", done: false },
                { t: "Team standup", m: "Done · 30 min", done: true },
                { t: "Write launch post", m: "6:30 PM IST", done: false },
              ].map((r) => (
                <div key={r.t} className={cn("mb-2 flex items-center gap-2.5 rounded-xl border px-3 py-2.5",
                  r.done ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/25 dark:bg-emerald-500/10"
                    : "border-black/5 bg-neutral-50 dark:border-white/5 dark:bg-neutral-800/60")}>
                  <span className={cn("grid size-4 shrink-0 place-items-center rounded-full border-2",
                    r.done ? "border-emerald-500 bg-emerald-500" : "border-neutral-300 dark:border-neutral-600")}>
                    {r.done && <Check className="size-2.5 text-white" strokeWidth={4} />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold">{r.t}</p>
                    <p className="text-[10px] text-neutral-400">{r.m}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden w-28 shrink-0 rounded-xl border border-black/5 bg-neutral-50 p-3 md:block dark:border-white/5 dark:bg-neutral-800/60">
              <p className="text-[10px] font-semibold text-neutral-400">Progress</p>
              <p className="mt-1 font-heading text-lg font-bold tabular-nums">5:15 PM</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div className="h-full w-2/5 rounded-full bg-emerald-500" />
              </div>
              <p className="mt-2 text-[10px] text-neutral-400">3 Done · 5 Left</p>
            </div>
          </div>
        </div>
      </div>
      {/* floating time-debt pill */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.8, ease: EASE, delay: 0.35 }}
        className="absolute -bottom-5 right-4 flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold shadow-lg shadow-black/5 sm:right-8 dark:border-red-500/30 dark:bg-neutral-900">
        <Clock className="size-4 text-red-500" />
        Time Debt: <span className="text-red-500">4.5h</span>
      </motion.div>
    </div>
  );
}

function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-24 pt-16 lg:grid-cols-2 lg:gap-10 lg:pt-24">
      <Reveal>
        <h1 className="font-heading text-5xl font-bold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
          Finally.<br />An honest<br />planner.
        </h1>
        <p className="mt-6 max-w-md text-[17px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          TeamTaskPro doesn&rsquo;t just list your tasks; it learns your reality. Spoken capture,
          smart scheduling, and accountability insights that keep you on track.
          Plan visually. Live realistically.
        </p>
        <Link href="/signup"
          className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-emerald-600 px-7 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700">
          Start Planning for Free
        </Link>
      </Reveal>
      <Reveal delay={0.15}><AppMock /></Reveal>
    </section>
  );
}

/* ---------------------------------- TEAM --------------------------------- */

function TeamMock() {
  const staff = [
    { n: "Ravi C.", pct: 98, tone: "emerald" },
    { n: "Priya K.", pct: 91, tone: "emerald" },
    { n: "Arjun M.", pct: 64, tone: "red" },
  ];
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[2fr_3fr]">
      {/* floating assignment cards */}
      <div className="relative mx-auto h-56 w-full max-w-sm">
        {[
          { top: "0%", left: "18%", w: "62%", av: "PK", avc: "bg-violet-200 text-violet-700" },
          { top: "36%", left: "2%", w: "58%", av: "RC", avc: "bg-amber-200 text-amber-700" },
          { top: "70%", left: "24%", w: "60%", av: "AM", avc: "bg-sky-200 text-sky-700" },
        ].map((c, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.8, ease: EASE, delay: i * 0.12 }}
            className="absolute flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3 shadow-md shadow-black/5 dark:border-white/10 dark:bg-neutral-900"
            style={{ top: c.top, left: c.left, width: c.w }}>
            <span className={cn("grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-bold", c.avc)}>{c.av}</span>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-2 w-4/5 rounded-full bg-neutral-200 dark:bg-neutral-700" />
              <div className="h-2 w-3/5 rounded-full bg-neutral-100 dark:bg-neutral-800" />
            </div>
          </motion.div>
        ))}
      </div>
      {/* dashboard mock */}
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl shadow-black/5 dark:border-white/10 dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-3 dark:border-white/5">
          <p className="font-heading text-sm font-bold">Dashboard</p>
          <div className="h-6 w-24 rounded-md bg-neutral-100 dark:bg-neutral-800" />
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {staff.map((s) => (
            <div key={s.n} className="rounded-xl border border-black/5 bg-neutral-50 p-3.5 dark:border-white/5 dark:bg-neutral-800/60">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold">{s.n}</p>
                <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums",
                  s.tone === "emerald" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                    : "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400")}>
                  {s.pct}%
                </span>
              </div>
              <div className="mt-2.5 space-y-1.5">
                <div className="h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-1.5 w-2/3 rounded-full bg-neutral-200 dark:bg-neutral-700" />
              </div>
              {s.tone === "red" && (
                <span className="mt-2.5 inline-flex items-center gap-1 rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-500/15 dark:text-red-400">
                  <AlertTriangle className="size-2.5" /> Overloaded
                </span>
              )}
            </div>
          ))}
          <div className="rounded-xl border border-dashed border-black/10 p-3.5 text-center text-[11px] font-medium text-neutral-400 dark:border-white/10">
            + Assign a task
          </div>
        </div>
      </div>
    </div>
  );
}

function Team() {
  return (
    <section id="team" className="mx-auto max-w-6xl px-5 py-20">
      <Reveal className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="uppercase">Team:</span> Sync, Assign, Deliver.
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          Assign work in seconds, see who&rsquo;s on it, and track on-time reliability
          for every member of your team.
        </p>
      </Reveal>
      <Reveal><TeamMock /></Reveal>
    </section>
  );
}

/* ---------------------------------- TASK --------------------------------- */

function VoiceDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const items = [
    { label: "Time", value: "3 PM" },
    { label: "Duration", value: "45 min" },
    { label: "Priority", value: "Urgent" },
  ];
  return (
    <div ref={ref} className="mx-auto max-w-2xl">
      {/* capture bar */}
      <div className="flex items-center gap-4 rounded-2xl border border-black/10 bg-white px-5 py-4 shadow-lg shadow-black/5 dark:border-white/10 dark:bg-neutral-900">
        <p className="min-w-0 flex-1 text-[15px] font-medium leading-snug sm:text-base">
          Meeting with Client tomorrow 3pm for 45 min urgent category:Work also add to gcal
        </p>
        <div className="relative grid size-11 shrink-0 place-items-center">
          {/* idle breathing pulse */}
          <motion.span
            className="absolute inset-0 rounded-full bg-emerald-500/15"
            animate={{ scale: [1, 1.18, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <Mic className="relative size-5 text-neutral-800 dark:text-neutral-200" />
        </div>
      </div>

      {/* extraction */}
      <motion.p className="mt-6 text-center text-[13px] font-semibold text-neutral-500 dark:text-neutral-400"
        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.4, ease: EASE }}>
        What AI understood
      </motion.p>
      <div className="mt-1 grid grid-cols-3">
        {items.map((it, i) => (
          <div key={it.label} className="flex flex-col items-center">
            {/* connector draws down first… */}
            <motion.span className="w-px origin-top bg-neutral-300 dark:bg-neutral-600"
              initial={{ height: 0 }} animate={inView ? { height: 24 } : {}}
              transition={{ duration: 0.3, ease: EASE, delay: 0.2 + i * 0.1 }} />
            {/* …then the value fades and slides up, staggered */}
            <motion.div className="mt-2 text-center"
              initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, ease: EASE, delay: 0.5 + i * 0.1 }}>
              <p className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">{it.label}:</p>
              <p className="font-heading text-xl font-bold sm:text-2xl">{it.value}</p>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Task() {
  return (
    <section id="task" className="mx-auto max-w-6xl px-5 py-6">
      <div className="rounded-3xl bg-neutral-100 px-5 py-16 sm:px-10 dark:bg-neutral-900/60">
        <Reveal className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="uppercase">Task:</span> Speak it. Done.
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            One sentence — typed or spoken. Date, time, duration, priority and
            Google Calendar all set themselves.
          </p>
        </Reveal>
        <Reveal><VoiceDemo /></Reveal>
      </div>
    </section>
  );
}

/* ----------------------------------- PRO ---------------------------------- */

function HonestyChart() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  // chart geometry (viewBox 0 0 520 240; plot 56..500 x, 16..200 y)
  const predicted = [[56, 196], [204, 118], [352, 92], [500, 28]] as const;
  const actual = [[56, 196], [204, 148], [352, 78], [500, 96]] as const;
  const path = (pts: readonly (readonly [number, number])[]) =>
    pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
  const DRAW = 1.2; // 1200ms per spec
  const dotDelay = (x: number) => ((x - 56) / (500 - 56)) * DRAW;

  return (
    <div ref={ref} className="rounded-2xl border border-black/10 bg-white p-5 shadow-lg shadow-black/5 sm:p-6 dark:border-white/10 dark:bg-neutral-900">
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] font-medium text-neutral-600 dark:text-neutral-300">
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-neutral-800 dark:bg-neutral-200" /> Predicted Effort</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" /> Actual Time Taken</span>
      </div>
      <svg viewBox="0 0 520 240" className="w-full">
        {/* y labels + grid */}
        {[0, 50, 100, 150, 200].map((v, i) => {
          const y = 200 - (v / 200) * 184;
          return (
            <g key={v}>
              <text x="44" y={y + 4} textAnchor="end" className="fill-neutral-400 text-[11px] tabular-nums">{v}</text>
              <line x1="56" x2="500" y1={y} y2={y} className={cn("stroke-neutral-200 dark:stroke-neutral-800", i === 0 && "stroke-neutral-300 dark:stroke-neutral-700")} strokeWidth="1" />
            </g>
          );
        })}
        {["Week 1", "Week 2", "Week 3", "Week 4"].map((l, i) => (
          <text key={l} x={56 + i * 148} y="228" textAnchor="middle" className="fill-neutral-400 text-[11px]">{l}</text>
        ))}
        {/* soft area under predicted */}
        <motion.path d={`${path(predicted)} L500 200 L56 200 Z`} className="fill-neutral-200/50 dark:fill-neutral-800/50"
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.8, ease: EASE, delay: DRAW * 0.6 }} />
        {/* self-drawing lines (stroke-dash via pathLength) */}
        <motion.path d={path(predicted)} fill="none" strokeWidth="3" strokeLinecap="round"
          className="stroke-neutral-800 dark:stroke-neutral-200"
          initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: DRAW, ease: EASE }} />
        <motion.path d={path(actual)} fill="none" strokeWidth="3" strokeLinecap="round" className="stroke-emerald-500"
          initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: DRAW, ease: EASE }} />
        {/* dots pop as the line reaches them */}
        {predicted.map(([x, y]) => (
          <motion.circle key={`p${x}`} cx={x} cy={y} r="5" className="fill-neutral-800 dark:fill-neutral-200"
            initial={{ scale: 0 }} animate={inView ? { scale: 1 } : {}}
            style={{ transformOrigin: `${x}px ${y}px` }}
            transition={{ duration: 0.25, ease: EASE, delay: dotDelay(x) }} />
        ))}
        {actual.map(([x, y]) => (
          <motion.circle key={`a${x}`} cx={x} cy={y} r="5" className="fill-emerald-500"
            initial={{ scale: 0 }} animate={inView ? { scale: 1 } : {}}
            style={{ transformOrigin: `${x}px ${y}px` }}
            transition={{ duration: 0.25, ease: EASE, delay: dotDelay(x) }} />
        ))}
      </svg>
    </div>
  );
}

const FORECAST = [
  { d: "Mon", s: "Clear", icon: Sun, tone: "calm" },
  { d: "Tue", s: "Busy", icon: CloudSun, tone: "busy" },
  { d: "Wed", s: "Overloaded", icon: AlertTriangle, tone: "storm" },
  { d: "Thu", s: "Overloaded", icon: AlertTriangle, tone: "storm" },
  { d: "Fri", s: "Busy", icon: CloudSun, tone: "busy" },
  { d: "Sat", s: "Clear", icon: Sun, tone: "calm" },
  { d: "Sun", s: "Clear", icon: Sun, tone: "calm" },
] as const;

function ForecastCard() {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-lg shadow-black/5 sm:p-6 dark:border-white/10 dark:bg-neutral-900">
      <p className="mb-4 font-heading text-base font-bold">Week Forecast</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 lg:grid-cols-4 xl:grid-cols-7">
        {FORECAST.map(({ d, s, icon: Icon, tone }) => (
          <div key={d}
            className={cn(
              "flex min-h-[88px] cursor-default flex-col items-center justify-center gap-1 rounded-xl border p-2 text-center",
              "transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10",
              tone === "storm"
                ? "border-red-200 bg-red-50 dark:border-red-500/25 dark:bg-red-500/10"
                : tone === "busy"
                  ? "border-amber-200 bg-amber-50 dark:border-amber-500/25 dark:bg-amber-500/10"
                  : "border-black/5 bg-neutral-50 dark:border-white/5 dark:bg-neutral-800/60",
            )}>
            <p className="text-[12px] font-bold">{d}</p>
            <Icon className={cn("size-4",
              tone === "storm" ? "text-red-500" : tone === "busy" ? "text-amber-500" : "text-neutral-400")} />
            <p className={cn("text-[10px] font-semibold leading-tight",
              tone === "storm" ? "text-red-600 dark:text-red-400" : tone === "busy" ? "text-amber-600 dark:text-amber-400" : "text-neutral-400")}>
              {s}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Pro() {
  return (
    <section id="pro" className="mx-auto max-w-6xl px-5 py-20">
      <Reveal className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="uppercase">Pro:</span> Master your capacity.
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          The honesty engine compares estimated vs. actual effort, learns your
          personal bias, and forecasts overloaded days before they happen.
        </p>
      </Reveal>
      <div className="grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
        <Reveal><HonestyChart /></Reveal>
        <Reveal delay={0.12}><ForecastCard /></Reveal>
      </div>
    </section>
  );
}

/* ------------------------------ Google band ------------------------------ */

function GcalLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-9" aria-hidden>
      <rect x="6" y="6" width="36" height="36" rx="4" fill="#fff" stroke="#e0e0e0" />
      <path d="M6 14h36v-4a4 4 0 0 0-4-4H10a4 4 0 0 0-4 4z" fill="#1a73e8" />
      <rect x="6" y="14" width="6" height="22" fill="#1a73e8" />
      <rect x="36" y="14" width="6" height="22" fill="#34a853" />
      <path d="M6 36h36v2a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" fill="#fbbc04" />
      <text x="24" y="31" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1a73e8">31</text>
    </svg>
  );
}

function GcalBand() {
  return (
    <section id="gcal" className="mx-auto max-w-6xl px-5 pb-24">
      <Reveal>
        <div className="grid items-center gap-8 rounded-3xl border border-black/10 bg-white p-8 shadow-lg shadow-black/5 sm:p-10 lg:grid-cols-2 dark:border-white/10 dark:bg-neutral-900">
          <div>
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Integrates with<br />Google Calendar
            </h2>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-300">
              Your events appear beside your tasks — and dated tasks land on your
              calendar automatically. Delete the task, the event goes too.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <GcalLogo />
              <span className="text-lg font-medium text-neutral-500 dark:text-neutral-300">Google Calendar</span>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
            <div className="flex items-center gap-2 bg-neutral-950 px-4 py-2.5 dark:bg-black">
              <Check className="size-4 text-emerald-400" strokeWidth={3} />
              <span className="text-[12px] font-semibold text-white">TeamTaskPro</span>
            </div>
            <div className="grid grid-cols-[90px_1fr] gap-3 bg-white p-4 dark:bg-neutral-900">
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800" />)}
              </div>
              <div className="space-y-2">
                <div className="h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-14 rounded-lg bg-emerald-100 dark:bg-emerald-500/15" />
                  <div className="h-14 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
                </div>
                <div className="h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* --------------------------------- footer -------------------------------- */

const FOOTER_COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Speak-to-plan", href: "#task" },
      { label: "Honesty engine", href: "#pro" },
      { label: "Team mode", href: "#team" },
      { label: "Google Calendar", href: "#gcal" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Get started", href: "/signup" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Contact us", href: "mailto:hello@teamtaskpro.com" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

function Footer() {
  return (
    <footer className="border-t border-black/5 bg-neutral-100 dark:border-white/5 dark:bg-neutral-900/60">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-5 py-14 sm:grid-cols-4">
        {FOOTER_COLS.map((col) => (
          <div key={col.title}>
            <p className="mb-3 text-[13px] font-bold">{col.title}</p>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.href.startsWith("#") || l.href.startsWith("mailto") ? (
                    <a href={l.href} className="text-[13px] text-neutral-500 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white">{l.label}</a>
                  ) : (
                    <Link href={l.href} className="text-[13px] text-neutral-500 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white">{l.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="border-t border-black/5 py-6 text-center text-[13px] text-neutral-500 dark:border-white/5 dark:text-neutral-400">
        © {new Date().getFullYear()} TeamTaskPro. All rights reserved.
      </p>
    </footer>
  );
}

/* ---------------------------------- page --------------------------------- */

export function Landing() {
  return (
    <div className="min-h-screen bg-[#EEF1F4] text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50">
      <Nav />
      <Hero />
      <Team />
      <Task />
      <Pro />
      <GcalBand />
      <Footer />
    </div>
  );
}
