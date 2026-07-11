"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Mic, Moon, CloudSun, AlertTriangle, Clock, Check,
  ChevronDown, ChevronLeft, ChevronRight, PanelLeft,
  CalendarDays, Settings, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Homepage v2 — built from the designer's spec. Light theme per the delivered
 * comps; dark is a derived variant pending the designer's dark pass.
 * Motion system: every structural animation uses cubic-bezier(0.22,1,0.36,1),
 * scroll reveals fade+rise 30px over 800ms at 15% visibility.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

// the comp's green is a muted jade, softer than tailwind emerald
const GREEN = "bg-[#3D9E77] hover:bg-[#348A67]";

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
    <header className="sticky top-0 z-40 px-3 pt-3">
      {/* floating white bar per comp */}
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between rounded-2xl bg-white px-4 shadow-sm shadow-black/5 sm:h-[68px] sm:px-7 dark:bg-neutral-900">
        {/* text-only logo per design note — no mark in the nav */}
        <Link href="/" className="font-heading text-xl font-bold tracking-tight">
          TaskTeamPro
        </Link>
        <nav className="hidden items-center gap-8 text-[15px] font-medium text-neutral-800 md:flex dark:text-neutral-200">
          <a href="#task" className="flex items-center gap-1 transition-colors hover:text-neutral-500 dark:hover:text-white">
            Product <ChevronDown className="size-4 text-neutral-500" />
          </a>
          <a href="#team" className="flex items-center gap-1 transition-colors hover:text-neutral-500 dark:hover:text-white">
            Use Cases <ChevronDown className="size-4 text-neutral-500" />
          </a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/login"
            className="flex min-h-11 items-center rounded-lg px-2 text-[15px] font-medium text-neutral-800 transition-colors hover:text-neutral-500 sm:px-3 dark:text-neutral-200 dark:hover:text-white">
            Log in
          </Link>
          <Link href="/signup"
            className={cn("flex min-h-12 items-center rounded-xl px-5 text-[15px] font-semibold text-white shadow-sm transition-colors sm:px-7", GREEN)}>
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ---------------------------------- hero --------------------------------- */

const SIDEBAR_ITEMS = [
  { label: "Today", icon: CalendarDays, active: true },
  { label: "Upcoming", icon: Clock, active: false },
  { label: "Tasks", icon: ClipboardList, active: false },
  { label: "Settings", icon: Settings, active: false },
];

function AppMock() {
  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl shadow-black/5 dark:border-white/10 dark:bg-neutral-900">
        {/* browser chrome: dots, panel toggle, back/forward, url bar */}
        <div className="flex items-center gap-3 border-b border-black/5 px-5 py-3 text-neutral-400 dark:border-white/5">
          <span className="flex gap-1.5">
            <span className="size-3 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            <span className="size-3 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            <span className="size-3 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          </span>
          <PanelLeft className="size-4" />
          <ChevronLeft className="size-4" />
          <ChevronRight className="size-4" />
          <div className="ml-2 h-7 flex-1 rounded-lg border border-black/5 bg-neutral-50 dark:border-white/5 dark:bg-neutral-800" />
        </div>
        <div className="flex">
          {/* sidebar with icons, like the comp */}
          <div className="hidden w-40 shrink-0 border-r border-black/5 p-4 sm:block dark:border-white/5">
            <svg viewBox="0 0 512 512" className="mb-5 size-8" aria-hidden>
              <circle cx="252" cy="262" r="140" fill="none" stroke="currentColor" strokeWidth="30" className="text-neutral-800 dark:text-neutral-200" />
              <path d="M192 208 L248 270 L376 120" fill="none" stroke="#fff" strokeWidth="86" strokeLinecap="round" strokeLinejoin="round" className="stroke-white dark:stroke-neutral-900" />
              <path d="M192 208 L248 270 L376 120" fill="none" stroke="currentColor" strokeWidth="42" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-800 dark:text-neutral-200" />
            </svg>
            {SIDEBAR_ITEMS.map(({ label, icon: Icon, active }) => (
              <div key={label} className={cn("mb-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium",
                active ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white" : "text-neutral-500 dark:text-neutral-400")}>
                <Icon className="size-3.5" /> {label}
              </div>
            ))}
          </div>
          {/* content */}
          <div className="min-w-0 flex-1 p-5 pr-8 sm:pr-24">
            <p className="font-heading text-xl font-bold">Today</p>
            <p className="mb-3 mt-2 text-[13px] font-semibold">Today</p>

            {/* row 1 — filled gray */}
            <div className="mb-2.5 rounded-xl border border-black/10 bg-neutral-100 px-4 py-3 dark:border-white/10 dark:bg-neutral-800">
              <div className="flex items-center gap-2.5">
                <span className="size-4 shrink-0 rounded-full border-2 border-neutral-400" />
                <p className="text-[13px] font-semibold">Pay electricity bill</p>
              </div>
              <p className="ml-[26px] mt-0.5 text-[11px] text-neutral-500">5:15 PM IST</p>
            </div>

            {/* row 2 — subtask progress + done badge */}
            <div className="mb-2.5 rounded-xl border border-black/5 bg-white px-4 py-3 shadow-sm dark:border-white/5 dark:bg-neutral-900">
              <div className="flex items-center gap-2.5">
                <span className="grid size-4 shrink-0 place-items-center rounded bg-[#3D9E77]">
                  <Check className="size-3 text-white" strokeWidth={4} />
                </span>
                <p className="text-[13px] font-semibold">Client meeting prep</p>
              </div>
              <div className="ml-[26px] mt-1.5 h-1.5 w-11/12 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div className="h-full w-2/3 rounded-full bg-[#3D9E77]" />
              </div>
              <div className="ml-[26px] mt-1.5 flex items-center justify-between">
                <p className="text-[11px] text-neutral-500">5:15 PM IST</p>
                <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">3 Done</span>
              </div>
            </div>

            {/* row 3 — plain white */}
            <div className="rounded-xl border border-black/5 bg-white px-4 py-3 shadow-sm dark:border-white/5 dark:bg-neutral-900">
              <div className="flex items-center gap-2.5">
                <span className="size-4 shrink-0 rounded-full border-2 border-neutral-300 dark:border-neutral-600" />
                <p className="text-[13px] font-semibold">Write launch post</p>
              </div>
              <p className="ml-[26px] mt-0.5 text-[11px] text-neutral-500">6:30 PM IST</p>
            </div>
          </div>
        </div>
      </div>

      {/* floating progress card over the window's right edge */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.8, ease: EASE, delay: 0.25 }}
        className="absolute right-2 top-24 hidden w-44 rounded-xl border border-black/5 bg-white p-4 shadow-xl shadow-black/10 sm:block lg:-right-4 dark:border-white/10 dark:bg-neutral-900">
        <p className="text-[13px] font-semibold text-neutral-500">Progress</p>
        <p className="mt-1 font-heading text-2xl font-bold tabular-nums">5:15 PM</p>
        <div className="mt-2.5 flex h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div className="w-3/5 bg-[#3D9E77]" />
          <div className="w-1/5 bg-amber-400" />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-neutral-500">
          <span>3 Done</span><span>5 Left</span>
        </div>
      </motion.div>

      {/* floating time-debt pill */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.8, ease: EASE, delay: 0.4 }}
        className="absolute -bottom-6 right-6 flex items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-2.5 text-base font-semibold shadow-lg shadow-black/10 sm:right-14 dark:border-white/10 dark:bg-neutral-900">
        <Clock className="size-5 text-red-500" />
        Time Debt: <span className="text-red-500">4.5h</span>
      </motion.div>
    </div>
  );
}

function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-24 pt-16 lg:grid-cols-2 lg:gap-8 lg:pt-24">
      <Reveal>
        <h1 className="font-heading text-[52px] font-bold leading-[1.02] tracking-tight sm:text-7xl lg:text-[88px]">
          Finally.<br />An honest<br />planner.
        </h1>
        <p className="mt-7 max-w-lg text-lg leading-relaxed text-neutral-700 sm:text-[19px] dark:text-neutral-300">
          TaskTeamPro doesn&rsquo;t just list your tasks; it learns your reality. Spoken capture,
          smart scheduling, and accountability insights that keep you on track.
          Plan visually. Live realistically.
        </p>
        <Link href="/signup"
          className={cn("mt-9 inline-flex min-h-[52px] items-center rounded-xl px-8 text-[16px] font-semibold text-white shadow-sm transition-colors", GREEN)}>
          Start Planning for Free
        </Link>
      </Reveal>
      {/* window bleeds off the right edge on desktop, like the comp */}
      <Reveal delay={0.15} className="lg:-mr-14 xl:-mr-24"><AppMock /></Reveal>
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
      {/* floating assignment cards + loose avatars, like the comp */}
      <div className="relative mx-auto h-56 w-full max-w-sm">
        {[
          { top: "16%", left: "88%", av: "SK", avc: "bg-emerald-200 text-emerald-800" },
          { top: "-4%", left: "2%", av: "NM", avc: "bg-rose-200 text-rose-700" },
          { top: "76%", left: "0%", av: "DG", avc: "bg-indigo-200 text-indigo-700" },
          { top: "88%", left: "86%", av: "TJ", avc: "bg-amber-200 text-amber-800" },
        ].map((a, i) => (
          <motion.span key={`av${i}`}
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.8, ease: EASE, delay: 0.2 + i * 0.08 }}
            className={cn("absolute z-10 grid size-10 place-items-center rounded-full border-2 border-white text-[11px] font-bold shadow-md dark:border-neutral-800", a.avc)}
            style={{ top: a.top, left: a.left }}>
            {a.av}
          </motion.span>
        ))}
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
      <motion.div className="mt-6 flex items-center justify-center gap-3 text-[13px] font-semibold text-neutral-500 dark:text-neutral-400"
        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.4, ease: EASE }}>
        {/* curved arrows flanking the label, like the comp */}
        <svg viewBox="0 0 40 24" className="h-5 w-8 -scale-x-100 text-neutral-400" fill="none" aria-hidden>
          <path d="M36 2 C20 4, 8 10, 5 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M2 15 L5 21 L10 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        What AI understood?
        <svg viewBox="0 0 40 24" className="h-5 w-8 text-neutral-400" fill="none" aria-hidden>
          <path d="M36 2 C20 4, 8 10, 5 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M2 15 L5 21 L10 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </motion.div>
      <div className="mt-2 grid grid-cols-3 divide-x divide-neutral-200 dark:divide-neutral-700">
        {items.map((it, i) => (
          <div key={it.label} className="flex flex-col items-center px-2">
            {/* connector draws down first… */}
            <motion.span className="w-px origin-top bg-neutral-300 dark:bg-neutral-600"
              initial={{ height: 0 }} animate={inView ? { height: 20 } : {}}
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
  { d: "Mon", s: "Clear", icon: Moon, tone: "calm" },
  { d: "Tue", s: "Busy", icon: CloudSun, tone: "busy" },
  { d: "Wed", s: "Overloaded", icon: AlertTriangle, tone: "storm" },
  { d: "Thu", s: "Overloaded", icon: AlertTriangle, tone: "storm" },
  { d: "Fri", s: "Busy", icon: CloudSun, tone: "busy" },
  { d: "Sat", s: "Clear", icon: Moon, tone: "calm" },
  { d: "Sun", s: "Clear", icon: Moon, tone: "calm" },
] as const;

function ForecastCard() {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-lg shadow-black/5 sm:p-6 dark:border-white/10 dark:bg-neutral-900">
      <p className="mb-4 font-heading text-base font-bold">Week Forecast</p>
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7 lg:grid-cols-4 xl:grid-cols-7">
        {FORECAST.map(({ d, s, icon: Icon, tone }) => (
          <div key={d}
            className={cn(
              "flex min-h-[86px] min-w-0 cursor-default flex-col items-center justify-center gap-1.5 rounded-xl border px-1 py-2 text-center",
              "transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10",
              tone === "storm"
                ? "border-red-200 bg-red-50 dark:border-red-500/25 dark:bg-red-500/10"
                : tone === "busy"
                  ? "border-amber-200 bg-amber-50 dark:border-amber-500/25 dark:bg-amber-500/10"
                  : "border-black/5 bg-neutral-50 dark:border-white/5 dark:bg-neutral-800/60",
            )}>
            <p className="text-[12px] font-bold">{d}</p>
            <Icon className={cn("size-4 shrink-0",
              tone === "storm" ? "text-red-500" : tone === "busy" ? "text-amber-500" : "text-neutral-400")} />
            <p className={cn("w-full text-[9px] font-semibold leading-none tracking-tight",
              tone === "storm" ? "text-red-600 dark:text-red-400" : tone === "busy" ? "text-amber-600 dark:text-amber-400" : "text-neutral-400")}>
              {s}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-5 text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
        Wed &amp; Thu are heading for overload —{" "}
        <span className="font-semibold text-red-500">move something now, not that morning.</span>
      </p>
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
              <span className="text-[12px] font-semibold text-white">TaskTeamPro</span>
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
      { label: "Contact us", href: "mailto:hello@taskteampro.com" },
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
        © {new Date().getFullYear()} TaskTeamPro. All rights reserved.
      </p>
    </footer>
  );
}

/* ---------------------------------- page --------------------------------- */

export function Landing() {
  return (
    <div className="min-h-screen overflow-x-clip bg-[#F3F5F7] text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50">
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
