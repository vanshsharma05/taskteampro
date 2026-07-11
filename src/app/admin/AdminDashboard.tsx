"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Users, Briefcase, AlertTriangle, TrendingUp,
  CornerUpRight, Check, UserPlus, Clock, ChevronRight,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/utils/supabase/client";
import { scoreTasks, taskStatus, isDoneNow, formatDue, type ScoringTask } from "@/lib/scoring";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;
const JADE = "bg-[#3D9E77] hover:bg-[#348A67] text-white";

type Member = { id: string; email: string | null };

function initials(email: string | null) { return (email ?? "?").slice(0, 2).toUpperCase(); }
function istToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

/* ------------------------------- component ------------------------------- */

export default function AdminDashboard({
  adminId, userEmail, companyId, companyName, members, tasks: initialTasks,
}: {
  adminId: string; userEmail: string; companyId: string; companyName: string;
  members: Member[]; tasks: ScoringTask[];
}) {
  const [tasks, setTasks] = useState<ScoringTask[]>(initialTasks);
  const now = new Date();
  const noMembers = members.length === 0;
  const supabase = useMemo(() => createClient(), []);

  const emailById = useMemo(() => {
    const m = new Map(members.map((x) => [x.id, x.email] as const));
    m.set(adminId, userEmail);
    return m;
  }, [members, adminId, userEmail]);

  // per-member capacity for smart delegation and the roster
  const memberStats = useMemo(() => members.map((m) => {
    const mine = tasks.filter((t) => t.user_id === m.id);
    const s = scoreTasks(mine, now);
    const open = mine.filter((t) => !isDoneNow(t, now)).length;
    return { member: m, s, open, overloaded: s.overdue > 0 || open >= 6 };
  }), [members, tasks]);

  const rosterSorted = useMemo(() => [...memberStats].sort((a, b) => {
    if (b.s.overdue !== a.s.overdue) return b.s.overdue - a.s.overdue;
    const sa = a.s.score ?? 101, sb = b.s.score ?? 101; // no-data sorts last
    return sa - sb;
  }), [memberStats]);

  // the owner's own work
  const myPlate = tasks
    .filter((t) => t.user_id === adminId && !isDoneNow(t, now))
    .sort((a, b) => (`${a.due_date}${a.due_time}` < `${b.due_date}${b.due_time}` ? -1 : 1));

  // company-wide KPIs
  const activeWork = tasks.filter((t) => !isDoneNow(t, now)).length;
  const overdueNow = tasks.filter((t) => taskStatus(t, now) === "overdue").length;
  const scored = memberStats.filter((r) => r.s.score !== null);
  const avgScore = scored.length ? Math.round(scored.reduce((n, r) => n + (r.s.score ?? 0), 0) / scored.length) : null;

  /* ------------------------------ mutations ------------------------------ */

  async function delegate(taskId: string, memberId: string) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, user_id: memberId } : t)));
    await supabase.from("tasks").update({ user_id: memberId, assigned_by: adminId }).eq("id", taskId);
  }
  async function pullBack(taskId: string) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, user_id: adminId } : t)));
    await supabase.from("tasks").update({ user_id: adminId, assigned_by: adminId }).eq("id", taskId);
  }
  async function complete(taskId: string) {
    const completed_at = new Date().toISOString();
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, is_done: true, completed_at } : t)));
    await supabase.from("tasks").update({ is_done: true, completed_at }).eq("id", taskId);
  }
  async function addToPlate(title: string, dueDate: string) {
    const payload = {
      user_id: adminId, assigned_by: adminId, company_id: companyId, title,
      importance: "normal", task_type: "special", due_date: dueDate, due_time: "17:00", recurrence: null,
    };
    const { data } = await supabase.from("tasks").insert(payload).select().single();
    if (data) setTasks((prev) => [data as ScoringTask, ...prev]);
  }

  return (
    <AppShell
      role="admin"
      userEmail={userEmail}
      title="Dashboard"
      primaryAction={!noMembers ? (
        <Link href="/assign" className={cn("inline-flex min-h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold shadow-sm transition-colors", JADE)}>
          <Plus className="size-4" /> Assign work
        </Link>
      ) : undefined}>
      <div className="mx-auto w-full max-w-5xl space-y-6 pb-16">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
          <p className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">{companyName}</p>
          <h2 className="mt-1 font-heading text-3xl font-bold tracking-tight">Command center</h2>
        </motion.div>

        {noMembers ? <EmptyTeam /> : (
          <>
            {overdueNow > 0 && (
              <Reveal>
                <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/25 dark:bg-red-500/10">
                  <AlertTriangle className="size-5 shrink-0 text-red-500" />
                  <p className="flex-1 text-sm font-medium">
                    {overdueNow} {overdueNow === 1 ? "task is" : "tasks are"} overdue across your team.
                  </p>
                  <a href="#team" className="text-sm font-semibold text-red-600 dark:text-red-400">Review</a>
                </div>
              </Reveal>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <Kpi icon={Users} label="Team" value={members.length} delay={0} />
              <Kpi icon={Briefcase} label="Active work" value={activeWork} delay={0.05} />
              <Kpi icon={Clock} label="On my plate" value={myPlate.length} delay={0.1} tone={myPlate.length > 0 ? "jade" : "muted"} />
              <Kpi icon={AlertTriangle} label="Overdue" value={overdueNow} delay={0.15} tone={overdueNow > 0 ? "red" : "muted"} />
              <Kpi icon={TrendingUp} label="On-time avg" value={avgScore === null ? "—" : `${avgScore}%`} delay={0.2} tone={avgScore !== null && avgScore >= 90 ? "jade" : "muted"} />
            </div>

            <MyPlate
              items={myPlate} members={memberStats} emailById={emailById}
              onAdd={addToPlate} onDelegate={delegate} onComplete={complete}
            />

            <Team
              rows={rosterSorted} avgScore={avgScore} tasks={tasks} now={now} onPullBack={pullBack}
            />

            <p className="px-1 text-xs text-muted-foreground">
              On-time % = share of resolved work finished by its deadline (late counts half). Delegating moves a task to a teammate; you can pull it back anytime.
            </p>
          </>
        )}
      </div>
    </AppShell>
  );
}

/* -------------------------------- my plate ------------------------------- */

function MyPlate({ items, members, emailById, onAdd, onDelegate, onComplete }: {
  items: ScoringTask[];
  members: { member: Member; s: ReturnType<typeof scoreTasks>; open: number; overloaded: boolean }[];
  emailById: Map<string, string | null>;
  onAdd: (title: string, dueDate: string) => void;
  onDelegate: (taskId: string, memberId: string) => void;
  onComplete: (taskId: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState(istToday());
  const inputRef = useRef<HTMLInputElement>(null);

  function submit() {
    const t = title.trim();
    if (!t) return;
    onAdd(t, due);
    setTitle("");
    inputRef.current?.focus();
  }

  return (
    <Reveal>
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-heading text-base font-bold">On my plate</h3>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Work you&rsquo;re holding — keep it, or delegate to someone with capacity.</p>
        </div>

        {/* capture */}
        <div className="flex flex-col gap-2 border-b border-border px-5 py-3 sm:flex-row sm:items-center">
          <input ref={inputRef} value={title} onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="Add work that just came in…"
            className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-transparent px-3.5 text-sm outline-none transition focus:border-foreground/30" />
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date"
            className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm outline-none transition focus:border-foreground/30" />
          <button onClick={submit} disabled={!title.trim()}
            className={cn("inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-5 text-sm font-semibold shadow-sm transition-colors disabled:opacity-40", JADE)}>
            <Plus className="size-4" /> Add
          </button>
        </div>

        {items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">Nothing on your plate. Add incoming work above, or assign it straight to the team.</p>
        ) : (
          <ul className="divide-y divide-border">
            <AnimatePresence initial={false}>
              {items.map((t) => (
                <PlateRow key={t.id} task={t} members={members} emailById={emailById} onDelegate={onDelegate} onComplete={onComplete} />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>
    </Reveal>
  );
}

function PlateRow({ task, members, emailById, onDelegate, onComplete }: {
  task: ScoringTask;
  members: { member: Member; s: ReturnType<typeof scoreTasks>; open: number; overloaded: boolean }[];
  emailById: Map<string, string | null>;
  onDelegate: (taskId: string, memberId: string) => void;
  onComplete: (taskId: string) => void;
}) {
  const [menu, setMenu] = useState(false);
  const overdue = taskStatus(task, new Date()) === "overdue";

  return (
    <motion.li layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.35, ease: EASE }} className="relative">
      <div className="flex items-center gap-3 px-5 py-3.5">
        <button onClick={() => onComplete(task.id)} aria-label="Mark done"
          className="grid size-6 shrink-0 place-items-center rounded-full border-2 border-muted-foreground/30 text-transparent transition hover:border-[#3D9E77] hover:text-[#3D9E77] active:scale-90">
          <Check className="size-3.5" strokeWidth={3} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{task.title}</p>
          <p className={cn("mt-0.5 text-[12px]", overdue ? "font-semibold text-red-600 dark:text-red-400" : "text-muted-foreground")}>
            {overdue ? "Overdue · " : ""}{formatDue(task)}
          </p>
        </div>
        <button onClick={() => setMenu((v) => !v)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[13px] font-semibold text-muted-foreground transition hover:border-foreground/30 hover:text-foreground">
          <CornerUpRight className="size-3.5" /> Delegate
        </button>
      </div>

      <AnimatePresence>
        {menu && (
          <>
            <button className="fixed inset-0 z-10 cursor-default" aria-hidden onClick={() => setMenu(false)} />
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute right-5 top-[calc(100%-6px)] z-20 w-64 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
              <p className="border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Give to</p>
              <ul className="max-h-64 overflow-y-auto py-1">
                {members.map(({ member, s, open, overloaded }) => (
                  <li key={member.id}>
                    <button onClick={() => { onDelegate(task.id, member.id); setMenu(false); }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-muted">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
                        {initials(member.email)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">{member.email ?? emailById.get(member.id)}</span>
                        <span className="block text-[11px] text-muted-foreground">
                          {s.score === null ? "no history" : `${s.score}% on-time`} · {open} open
                        </span>
                      </span>
                      {overloaded && <span className="shrink-0 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-500/15 dark:text-red-400">Busy</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

/* --------------------------------- team ---------------------------------- */

function Team({ rows, avgScore, tasks, now, onPullBack }: {
  rows: { member: Member; s: ReturnType<typeof scoreTasks>; open: number; overloaded: boolean }[];
  avgScore: number | null; tasks: ScoringTask[]; now: Date;
  onPullBack: (taskId: string) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <Reveal>
      <section id="team" className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="font-heading text-base font-bold">Your team</h3>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Whoever needs attention shows first.</p>
          </div>
          {avgScore !== null && (
            <span className="text-sm text-muted-foreground">
              On-time avg <span className="font-bold tabular-nums text-foreground">{avgScore}%</span>
            </span>
          )}
        </div>
        <ul className="divide-y divide-border">
          {rows.map(({ member, s, open, overloaded }) => {
            const expanded = openId === member.id;
            const theirOpen = tasks.filter((t) => t.user_id === member.id && !isDoneNow(t, now));
            return (
              <li key={member.id}>
                <button onClick={() => setOpenId(expanded ? null : member.id)}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-muted/40">
                  <span className={cn("grid size-10 shrink-0 place-items-center rounded-full text-xs font-semibold",
                    overloaded ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400" : "bg-accent text-accent-foreground")}>
                    {initials(member.email)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{member.email ?? "Unknown"}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-muted-foreground">
                      <span>{open} open</span>
                      {s.overdue > 0 && <><span>·</span><span className="font-semibold text-red-600 dark:text-red-400">{s.overdue} overdue</span></>}
                      {overloaded && <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-500/15 dark:text-red-400">Overloaded</span>}
                    </span>
                  </span>
                  <Reliability score={s.score} />
                  <ChevronRight className={cn("size-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-90")} />
                </button>

                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden bg-muted/30">
                      {theirOpen.length === 0 ? (
                        <p className="px-5 py-4 text-[13px] text-muted-foreground">No open work. Assign something from the top of the page.</p>
                      ) : (
                        <ul className="divide-y divide-border/60">
                          {theirOpen.map((t) => {
                            const od = taskStatus(t, now) === "overdue";
                            return (
                              <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                                <span className={cn("size-1.5 shrink-0 rounded-full", od ? "bg-red-500" : "bg-[#3D9E77]")} />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-[13px] font-medium">{t.title}</span>
                                  <span className={cn("text-[11px]", od ? "font-semibold text-red-600 dark:text-red-400" : "text-muted-foreground")}>
                                    {od ? "Overdue · " : ""}{formatDue(t)}
                                  </span>
                                </span>
                                <button onClick={() => onPullBack(t.id)}
                                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[12px] font-semibold text-muted-foreground transition hover:border-foreground/30 hover:text-foreground">
                                  <CornerUpRight className="size-3 -scale-x-100" /> Take back
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </section>
    </Reveal>
  );
}

function Reliability({ score }: { score: number | null }) {
  const tone = score === null ? "muted" : score >= 90 ? "jade" : score >= 70 ? "amber" : "red";
  const text = tone === "jade" ? "text-[#3D9E77]" : tone === "amber" ? "text-amber-600 dark:text-amber-400" : tone === "red" ? "text-red-600 dark:text-red-400" : "text-muted-foreground";
  return (
    <span className="hidden w-16 shrink-0 text-right sm:block">
      <span className={cn("font-heading text-xl font-bold tabular-nums", text)}>{score === null ? "—" : `${score}%`}</span>
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">on-time</span>
    </span>
  );
}

/* -------------------------------- pieces --------------------------------- */

function Reveal({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.7, ease: EASE }}>
      {children}
    </motion.div>
  );
}

function Kpi({ icon: Icon, label, value, delay, tone = "muted" }: {
  icon: typeof Users; label: string; value: number | string; delay: number;
  tone?: "muted" | "jade" | "red";
}) {
  const valueText = tone === "jade" ? "text-[#3D9E77]" : tone === "red" ? "text-red-600 dark:text-red-500" : "text-foreground";
  const iconWrap = tone === "jade" ? "bg-[#3D9E77]/10 text-[#3D9E77]" : tone === "red" ? "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400" : "bg-muted text-muted-foreground";
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE, delay }}
      className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className={cn("grid size-8 place-items-center rounded-lg", iconWrap)}><Icon className="size-4" /></span>
      </div>
      <span className={cn("font-heading text-3xl font-bold tabular-nums", valueText)}>{value}</span>
    </motion.div>
  );
}

function EmptyTeam() {
  return (
    <Reveal>
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-16 text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-[#3D9E77]/10 text-[#3D9E77]">
          <UserPlus className="size-6" />
        </div>
        <div className="space-y-1">
          <p className="font-heading text-lg font-bold">Invite your team to begin</p>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">Share your join code from the Team page. Once people join, capture incoming work and delegate it here.</p>
        </div>
        <Link href="/team" className={cn("mt-1 inline-flex min-h-10 items-center gap-1.5 rounded-xl px-5 text-sm font-semibold shadow-sm transition-colors", JADE)}>
          Go to Team
        </Link>
      </div>
    </Reveal>
  );
}
