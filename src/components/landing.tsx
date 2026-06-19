"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  ArrowRight, Gauge, Lock, Repeat, Sun, ListChecks, Smartphone,
  UserPlus, ClipboardList, ChevronDown, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarketingShell } from "@/components/marketing-shell";

const reveal: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 28 } },
};
const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

export function Landing() {
  return (
    <MarketingShell>
      <Hero />
      <Outcome />
      <HowItWorks />
      <Features />
      <FAQ />
      <CTA />
    </MarketingShell>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-24 pt-36">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[480px] w-[680px] -translate-x-1/2 rounded-full bg-indigo-500/[0.07] blur-3xl" />
      <div className="mx-auto max-w-3xl text-center">
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div variants={reveal} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground shadow-sm">
            <span className="size-1.5 rounded-full bg-indigo-500" /> Task accountability for small business teams
          </motion.div>
          <motion.h1 variants={reveal} className="mt-6 font-heading text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Know your team&apos;s work<br className="hidden sm:block" /> is{" "}
            <span className="text-indigo-600 dark:text-indigo-400">getting done</span>
          </motion.h1>
          <motion.p variants={reveal} className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Assign tasks, track them, and see exactly who&apos;s on top of things — without chasing a single person on WhatsApp.
          </motion.p>
          <motion.div variants={reveal} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 font-semibold text-background shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:w-auto">
              Start free <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a href="#how" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-6 py-3 font-semibold transition hover:-translate-y-0.5 hover:border-foreground/30 sm:w-auto">
              See how it works
            </a>
          </motion.div>
          <motion.p variants={reveal} className="mt-4 text-[13px] text-muted-foreground">Free to start · No credit card · Set up in minutes</motion.p>
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 90, damping: 18, delay: 0.25 }} className="mx-auto mt-16 max-w-3xl">
        <Mockup />
      </motion.div>
    </section>
  );
}

const previewRows = [
  { name: "Priya Sharma", status: "On track", tone: "emerald", pct: "96%" },
  { name: "Arjun Mehta", status: "Watch", tone: "amber", pct: "78%" },
  { name: "Ravi Kumar", status: "Behind", tone: "red", pct: "54%", note: "2 overdue" },
] as const;

const pillTone: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  red: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400",
};

function Mockup() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-foreground/10">
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
        <span className="size-2.5 rounded-full bg-muted-foreground/30" />
        <span className="size-2.5 rounded-full bg-muted-foreground/30" />
        <span className="size-2.5 rounded-full bg-muted-foreground/30" />
        <div className="ml-3 h-5 max-w-xs flex-1 rounded-md bg-muted/60" />
      </div>
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-heading text-base font-bold tracking-tight">Team status</p>
            <p className="text-xs text-muted-foreground">Whoever needs attention shows first</p>
          </div>
          <span className="text-xs text-muted-foreground">On-time avg <span className="font-bold text-foreground">76%</span></span>
        </div>
        <div className="space-y-2">
          {previewRows.map((r) => (
            <div key={r.name} className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
                {r.name.split(" ").map((p) => p[0]).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.name}</p>
                {"note" in r && r.note && <p className="text-[11px] font-semibold text-red-600 dark:text-red-400">{r.note}</p>}
              </div>
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", pillTone[r.tone])}>{r.status}</span>
              <span className="w-9 text-right font-heading text-sm font-bold tabular-nums">{r.pct}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Outcome() {
  const pains = [
    { k: "Before", v: "“Did anyone send the report?” — and three WhatsApp messages to find out." },
    { k: "After", v: "One glance tells you what's done, what's late, and who needs a nudge." },
  ];
  return (
    <section className="border-y border-border bg-muted/30 px-5 py-16">
      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
        {pains.map((p) => (
          <motion.div key={p.k} variants={reveal} className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">{p.k}</p>
            <p className="mt-2 font-heading text-lg font-semibold leading-snug">{p.v}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

const steps: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: UserPlus, title: "Add your team", body: "Share a join code. People are in within seconds — no setup headache." },
  { icon: ClipboardList, title: "Assign the work", body: "One-time or recurring tasks, with deadlines and dependencies. Set it and it's tracked." },
  { icon: Gauge, title: "See who's on track", body: "A live view of done, due, overdue, and who needs a nudge — at a glance." },
];

function HowItWorks() {
  return (
    <section id="how" className="px-5 py-24">
      <SectionHeading eyebrow="How it works" title="From scattered to accountable in three steps" />
      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="mx-auto mt-14 grid max-w-5xl gap-8 md:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div key={s.title} variants={reveal}>
            <div className="flex size-11 items-center justify-center rounded-xl border border-border bg-card text-indigo-600 shadow-sm dark:text-indigo-400">
              <s.icon className="size-5" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-heading text-sm font-bold text-muted-foreground">0{i + 1}</span>
              <h3 className="font-heading text-lg font-bold tracking-tight">{s.title}</h3>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

const features: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Gauge, title: "Accountability dashboard", body: "On-time reliability per person, sorted so whoever needs attention shows up first." },
  { icon: Lock, title: "Blockers & dependencies", body: "Mark a task as waiting on another. It auto-clears the moment the blocker is done." },
  { icon: Repeat, title: "Recurring tasks", body: "Daily reports, opening checklists, weekly follow-ups — set once, they keep coming." },
  { icon: Sun, title: "Morning brief", body: "Each person opens to what's due today, what slipped, and what to focus on first." },
  { icon: ListChecks, title: "Simple for staff", body: "A clean to-do list with one-tap done. No training, no clutter." },
  { icon: Smartphone, title: "Works on mobile", body: "Built for teams that run from their phones, not a desk." },
];

function Features() {
  return (
    <section id="features" className="border-t border-border bg-muted/30 px-5 py-24">
      <SectionHeading eyebrow="Features" title="Everything you need to keep work on track" />
      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="mx-auto mt-14 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <motion.div key={f.title} variants={reveal} whileHover={{ y: -4 }} className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-lg">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-indigo-600 dark:text-indigo-400">
              <f.icon className="size-5" />
            </div>
            <h3 className="mt-4 font-heading text-base font-bold tracking-tight">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

const faqs = [
  { q: "Do my staff need to install anything?", a: "No. They open a link, enter a join code, and they're in. It works right in the browser on any phone or computer." },
  { q: "Is it hard to set up?", a: "No. Create your company, share the join code, and start assigning tasks. Most teams are up and running in a few minutes." },
  { q: "Can I track recurring work?", a: "Yes. Daily, weekly, monthly, or yearly tasks repeat automatically and reset on their own schedule." },
  { q: "What does it cost?", a: "It's free to start while we're in early access. We'll introduce simple pricing later — early teams get the best deal." },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="px-5 py-24">
      <SectionHeading eyebrow="FAQ" title="Questions, answered" />
      <div className="mx-auto mt-12 max-w-2xl">
        {faqs.map((f, i) => (
          <div key={i} className="border-b border-border">
            <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 py-4 text-left">
              <span className="font-heading text-base font-semibold tracking-tight">{f.q}</span>
              <ChevronDown className={cn("size-5 shrink-0 text-muted-foreground transition-transform", open === i && "rotate-180")} />
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                  <p className="pb-4 text-sm text-muted-foreground">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="px-5 py-20">
      <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
        className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-foreground px-6 py-20 text-center text-background sm:px-12">
        <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
        <h2 className="relative font-heading text-3xl font-bold tracking-tight sm:text-4xl">Stop chasing. Start knowing.</h2>
        <p className="relative mx-auto mt-3 max-w-xl text-background/70">Give your team a clear list and yourself a clear view. It takes a few minutes to set up.</p>
        <Link href="/signup" className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 font-semibold text-foreground shadow-lg transition hover:-translate-y-0.5">
          Start free <ArrowRight className="size-4" />
        </Link>
      </motion.div>
    </section>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="mx-auto max-w-2xl text-center">
      <motion.p variants={reveal} className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">{eyebrow}</motion.p>
      <motion.h2 variants={reveal} className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">{title}</motion.h2>
    </motion.div>
  );
}
