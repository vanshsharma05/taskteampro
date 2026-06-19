"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  ArrowRight, Menu, X, ChevronDown, Check, Repeat, Clock, Gauge, Lock,
  Sun, Smartphone, Bell, Flag, Sparkles, UserPlus, ClipboardList, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const reveal: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 28 } },
};
const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

export function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <Nav />
      <Hero />
      <TrustStrip />
      <Outcome />
      <HowItWorks />
      <Bento />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <div className={cn("flex size-8 items-center justify-center rounded-lg font-heading text-sm font-bold shadow-sm", light ? "bg-white text-foreground" : "bg-foreground text-background")}>T</div>
      <span className={cn("font-heading text-lg font-bold tracking-tight", light && "text-white")}>TeamTaskPro</span>
    </Link>
  );
}

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const links = [
    { href: "#how", label: "How it works" },
    { href: "#features", label: "Features" },
    { href: "#faq", label: "FAQ" },
  ];
  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 transition-all duration-300", scrolled ? "border-b border-border bg-background/80 backdrop-blur-xl" : "border-b border-transparent")}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-muted-foreground transition hover:text-foreground">{l.label}</a>
          ))}
        </nav>
        <div className="hidden items-center gap-1.5 md:flex">
          <Link href="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground">Log in</Link>
          <Link href="/signup" className="group inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            Start free <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <button onClick={() => setOpen(!open)} aria-label="Menu" className="rounded-md p-1.5 text-foreground transition hover:bg-accent md:hidden">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden border-b border-border bg-background md:hidden">
            <div className="flex flex-col gap-1 px-5 py-3">
              {links.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground">{l.label}</a>
              ))}
              <div className="mt-2 flex flex-col gap-2">
                <Link href="/login" onClick={() => setOpen(false)} className="rounded-full border border-border px-4 py-2 text-center text-sm font-semibold">Log in</Link>
                <Link href="/signup" onClick={() => setOpen(false)} className="rounded-full bg-foreground px-4 py-2 text-center text-sm font-semibold text-background">Start free</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function GridGlow() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 -z-20 opacity-[0.35] dark:opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, #000 40%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, #000 40%, transparent 75%)",
        }} />
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-indigo-500/[0.08] blur-3xl" />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-24 pt-36">
      <GridGlow />
      <div className="mx-auto max-w-3xl text-center">
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div variants={reveal} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground shadow-sm">
            <Sparkles className="size-3.5 text-indigo-500" /> Task accountability for teams — and your own day
          </motion.div>
          <motion.h1 variants={reveal} className="mt-6 font-heading text-5xl font-bold leading-[1.02] tracking-tight sm:text-7xl">
            Know it&rsquo;s actually<br className="hidden sm:block" />{" "}
            <span className="bg-gradient-to-br from-indigo-500 to-indigo-700 bg-clip-text text-transparent dark:from-indigo-300 dark:to-indigo-500">getting done</span>
          </motion.h1>
          <motion.p variants={reveal} className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Assign work, track it, and see exactly who&rsquo;s on top of things — without chasing a single person on WhatsApp. Plus a clean personal to-do and reminders for yourself.
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

const teamRows = [
  { name: "Priya Sharma", status: "On track", tone: "emerald", pct: "96%" },
  { name: "Arjun Mehta", status: "Watch", tone: "amber", pct: "78%" },
  { name: "Ravi Kumar", status: "Behind", tone: "red", pct: "54%", note: "2 overdue" },
] as const;

const pillTone: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  red: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400",
};

const dayRows = [
  { title: "Drink water", meta: "every 30 min", done: false, high: false, icon: Repeat },
  { title: "Take creatine", meta: "every day", done: true, high: false, icon: Repeat },
  { title: "Call supplier", meta: "3:01 PM", done: false, high: true, icon: Clock },
  { title: "Wash hair", meta: "Mon, Thu", done: false, high: false, icon: Repeat },
] as const;

function Mockup() {
  const [tab, setTab] = useState<"team" | "day">("team");
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-foreground/10">
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
        <span className="size-2.5 rounded-full bg-muted-foreground/30" />
        <span className="size-2.5 rounded-full bg-muted-foreground/30" />
        <span className="size-2.5 rounded-full bg-muted-foreground/30" />
        <div className="ml-3 flex gap-1 rounded-full border border-border bg-muted/40 p-0.5 text-xs font-semibold">
          {(["team", "day"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("rounded-full px-3 py-1 transition", tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>
              {t === "team" ? "Team view" : "My day"}
            </button>
          ))}
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="relative flex size-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex size-2 rounded-full bg-emerald-500" /></span>
          Live
        </span>
      </div>

      <AnimatePresence mode="wait">
        {tab === "team" ? (
          <motion.div key="team" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-heading text-base font-bold tracking-tight">Team status</p>
                <p className="text-xs text-muted-foreground">Whoever needs attention shows first</p>
              </div>
              <span className="text-xs text-muted-foreground">On-time avg <span className="font-bold text-foreground">76%</span></span>
            </div>
            <div className="space-y-2">
              {teamRows.map((r) => (
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
          </motion.div>
        ) : (
          <motion.div key="day" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-heading text-base font-bold tracking-tight">Today</p>
                <p className="text-xs text-muted-foreground">1 of 4 done</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-[11px] font-semibold text-background">Add task</span>
            </div>
            <div className="space-y-2">
              {dayRows.map((r) => {
                const Icon = r.icon;
                return (
                  <div key={r.title} className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
                    <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border-2", r.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground/30")}>
                      {r.done && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    <p className={cn("flex-1 truncate text-sm font-medium", r.done && "text-muted-foreground line-through")}>{r.title}</p>
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Icon className="size-3" />{r.meta}</span>
                    {r.high && <Flag className="size-3 text-amber-500" />}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const trust = ["No app to install", "Set up in minutes", "Works on any phone", "Free to start"];

function TrustStrip() {
  return (
    <section className="border-y border-border bg-muted/30 px-5 py-5">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm font-medium text-muted-foreground">
        {trust.map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5"><Check className="size-4 text-indigo-500" />{t}</span>
        ))}
      </div>
    </section>
  );
}

function Outcome() {
  const pains = [
    { k: "Before", v: "“Did anyone send the report?” — and three WhatsApp messages to find out." },
    { k: "After", v: "One glance tells you what's done, what's late, and who needs a nudge." },
  ];
  return (
    <section className="px-5 py-16">
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
    <section id="how" className="border-t border-border bg-muted/30 px-5 py-24">
      <SectionHeading eyebrow="How it works" title="From scattered to accountable in three steps" />
      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="mx-auto mt-14 grid max-w-5xl gap-8 md:grid-cols-3">
        {steps.map(({ icon: Icon, title, body }, i) => (
          <motion.div key={title} variants={reveal}>
            <div className="flex size-11 items-center justify-center rounded-xl border border-border bg-card text-indigo-600 shadow-sm dark:text-indigo-400">
              <Icon className="size-5" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-heading text-sm font-bold text-muted-foreground">0{i + 1}</span>
              <h3 className="font-heading text-lg font-bold tracking-tight">{title}</h3>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function Bento() {
  return (
    <section id="features" className="px-5 py-24">
      <SectionHeading eyebrow="Features" title="Everything to keep work — and life — on track" />
      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="mx-auto mt-14 grid max-w-5xl auto-rows-fr grid-cols-1 gap-4 md:grid-cols-3">
        {/* wide: accountability */}
        <motion.div variants={reveal} className="group rounded-3xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-lg md:col-span-2">
          <Tile icon={Gauge} title="Accountability dashboard" body="On-time reliability per person, sorted so whoever needs attention shows up first." />
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">On track 96%</span>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">Watch 78%</span>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 dark:bg-red-500/15 dark:text-red-400">Behind 54%</span>
          </div>
        </motion.div>

        <BentoCard icon={Repeat} title="Repeating reminders" body="Creatine daily, shampoo Mon &amp; Thu — set once, they tick off and reset on their own." />
        <BentoCard icon={Sun} title="Your daily list" body="A clean Today view of what's due and what's recurring. Tap to tick it off." />
        <BentoCard icon={Lock} title="Blockers &amp; dependencies" body="Mark a task as waiting on another. It auto-clears the moment the blocker is done." />
        <BentoCard icon={Smartphone} title="Built for your phone" body="No install, no training. Open a link and you're running — on any device." />

        {/* wide dark: smart reminders (coming soon) */}
        <motion.div variants={reveal} className="relative overflow-hidden rounded-3xl bg-foreground p-6 text-background md:col-span-3">
          <div className="pointer-events-none absolute right-0 top-0 h-40 w-64 rounded-full bg-indigo-500/25 blur-3xl" />
          <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <div className="flex items-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-xl bg-background/10"><Bell className="size-5" /></div>
                <span className="rounded-full bg-background/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">Coming soon</span>
              </div>
              <h3 className="mt-4 font-heading text-xl font-bold tracking-tight">Smart reminders that reach you</h3>
              <p className="mt-1.5 text-sm text-background/70">Get pinged at exactly 3:01 PM, or every 30 minutes to drink water — even when the app is closed.</p>
            </div>
            <Link href="/signup" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:-translate-y-0.5">
              Get early access <ArrowRight className="size-4" />
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function BentoCard({ icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <motion.div variants={reveal} className="rounded-3xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-lg">
      <Tile icon={icon} title={title} body={body} />
    </motion.div>
  );
}

function Tile({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <>
      <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-indigo-600 dark:text-indigo-400">
        <Icon className="size-5" />
      </div>
      <h3 className="mt-4 font-heading text-base font-bold tracking-tight" dangerouslySetInnerHTML={{ __html: title }} />
      <p className="mt-1.5 text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: body }} />
    </>
  );
}

const faqs = [
  { q: "Do my staff need to install anything?", a: "No. They open a link, enter a join code, and they're in — right in the browser, on any phone or computer." },
  { q: "Can I use it just for myself?", a: "Yes. There's a full personal side: a clean daily to-do list with recurring reminders that reset on their own. No team required." },
  { q: "Can I set tasks to repeat?", a: "Yes — every day, specific weekdays (like Mon & Thu), or monthly. They tick off and come back on schedule automatically." },
  { q: "Will it remind me at a specific time?", a: "You can set an exact time, down to the minute. Notifications that actively ping you — even when the app is closed — are coming soon." },
  { q: "What does it cost?", a: "It's free to start while we're in early access. We'll introduce simple pricing later — early teams get the best deal." },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="border-t border-border bg-muted/30 px-5 py-24">
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

function Footer() {
  const cols = [
    { title: "Product", links: [{ href: "#features", label: "Features" }, { href: "#how", label: "How it works" }, { href: "#faq", label: "FAQ" }] },
    { title: "Company", links: [{ href: "/about", label: "About" }, { href: "/contact", label: "Contact" }] },
    { title: "Legal", links: [{ href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" }] },
  ];
  return (
    <footer className="border-t border-border px-5 py-14">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">Know your team&rsquo;s work is getting done.</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="text-sm font-semibold">{c.title}</p>
            <ul className="mt-3 space-y-2">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground transition hover:text-foreground">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-12 flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
        <p className="text-[13px] text-muted-foreground">&copy; {new Date().getFullYear()} TeamTaskPro. All rights reserved.</p>
        <Link href="/signup" className="text-[13px] font-semibold text-foreground transition hover:opacity-70">Get started &rarr;</Link>
      </div>
    </footer>
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
