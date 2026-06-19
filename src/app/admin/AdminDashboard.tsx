"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Users, CalendarClock, CheckCircle2, AlertTriangle, UserPlus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { scoreTasks, type ScoringTask } from "@/lib/scoring";
import { cn } from "@/lib/utils";

type Member = { id: string; email: string | null };

function initialsOf(email: string | null) { return (email ?? "?").slice(0, 2).toUpperCase(); }

export default function AdminDashboard({ userEmail, companyName, members, tasks }: {
  userEmail: string; companyName: string; members: Member[]; tasks: ScoringTask[];
}) {
  const now = new Date();
  const noMembers = members.length === 0;

  const rows = members.map((m) => ({ member: m, s: scoreTasks(tasks.filter((t) => t.user_id === m.id), now) }));
  rows.sort((a, b) => {
    if (b.s.overdue !== a.s.overdue) return b.s.overdue - a.s.overdue;
    const sa = a.s.score, sb = b.s.score;
    if (sa === null && sb === null) return 0;
    if (sa === null) return 1;
    if (sb === null) return -1;
    return sa - sb;
  });

  const dueToday = rows.reduce((n, r) => n + r.s.dueTodayTotal, 0);
  const doneToday = rows.reduce((n, r) => n + r.s.doneToday, 0);
  const overdueNow = rows.reduce((n, r) => n + r.s.overdue, 0);
  const scored = rows.filter((r) => r.s.score !== null);
  const avgScore = scored.length ? Math.round(scored.reduce((n, r) => n + (r.s.score ?? 0), 0) / scored.length) : null;

  return (
    <AppShell
      role="admin"
      userEmail={userEmail}
      title="Dashboard"
      primaryAction={!noMembers ? (
        <Button nativeButton={false} render={<Link href="/assign" />} className="rounded-full shadow-sm">
          <Plus className="size-4" /> New assignment
        </Button>
      ) : undefined}>
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{companyName}</p>
          <h2 className="mt-1 font-heading text-3xl font-bold tracking-tight">Where your team stands today</h2>
        </motion.div>

        {noMembers ? (
          <EmptyTeam />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile icon={Users} label="Team" value={members.length} tone="muted" delay={0} />
              <StatTile icon={CalendarClock} label="Due today" value={dueToday} tone="muted" delay={0.05} />
              <StatTile icon={CheckCircle2} label="Done today" value={doneToday} tone="emerald" delay={0.1} />
              <StatTile icon={AlertTriangle} label="Overdue" value={overdueNow} tone={overdueNow > 0 ? "red" : "muted"} delay={0.15} />
            </div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}>
              <Card className="overflow-hidden p-0">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <div>
                    <h3 className="font-heading text-sm font-bold uppercase tracking-wide">Team status</h3>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">Whoever needs attention shows first</p>
                  </div>
                  {avgScore !== null && (
                    <span className="text-sm text-muted-foreground">
                      On-time avg <span className="font-bold tabular-nums text-foreground">{avgScore}%</span>
                    </span>
                  )}
                </div>
                <ul className="divide-y divide-border">
                  {rows.map((r) => (
                    <li key={r.member.id} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/40">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                        {initialsOf(r.member.email)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{r.member.email ?? "Unknown"}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-muted-foreground">
                          <span>{r.s.doneToday}/{r.s.dueTodayTotal} done today</span>
                          {r.s.overdue > 0 && (
                            <>
                              <span>·</span>
                              <span className="font-semibold text-red-600 dark:text-red-400">{r.s.overdue} overdue</span>
                            </>
                          )}
                        </div>
                      </div>
                      <StatusPill score={r.s.score} overdue={r.s.overdue} />
                      <div className="w-14 shrink-0 text-right">
                        <div className="font-heading text-xl font-bold tabular-nums">{r.s.score === null ? "—" : `${r.s.score}%`}</div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">on-time</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>

            <p className="px-1 text-xs text-muted-foreground">
              On-time % = share of due work completed on time (late counts half). Repeating tasks reset automatically on their schedule.
            </p>
          </>
        )}
      </div>
    </AppShell>
  );
}

function StatusPill({ score, overdue }: { score: number | null; overdue: number }) {
  let label: string;
  let cls: string;
  if (overdue > 0) { label = "Behind"; cls = "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400"; }
  else if (score === null) { label = "No tasks"; cls = "bg-muted text-muted-foreground"; }
  else if (score >= 90) { label = "On track"; cls = "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"; }
  else if (score >= 70) { label = "Watch"; cls = "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"; }
  else { label = "Behind"; cls = "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400"; }
  return <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold", cls)}>{label}</span>;
}

function StatTile({ icon: Icon, label, value, tone, delay }: {
  icon: typeof Users; label: string; value: number; tone: "muted" | "emerald" | "red"; delay: number;
}) {
  const toneText = tone === "emerald" ? "text-emerald-600 dark:text-emerald-400" : tone === "red" ? "text-red-600 dark:text-red-500" : "text-foreground";
  const toneIcon = tone === "emerald" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400" : tone === "red" ? "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400" : "bg-muted text-muted-foreground";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay }}>
      <Card className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
          <div className={cn("flex size-8 items-center justify-center rounded-lg", toneIcon)}>
            <Icon className="size-4" />
          </div>
        </div>
        <span className={cn("font-heading text-3xl font-bold tabular-nums", toneText)}>{value}</span>
      </Card>
    </motion.div>
  );
}

function EmptyTeam() {
  return (
    <Card className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-indigo-600 dark:text-indigo-400">
        <UserPlus className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="font-heading text-lg font-bold">Invite your team to begin</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">Share your join code from the Team page. Once people join, assign work and track it here.</p>
      </div>
      <Button nativeButton={false} render={<Link href="/team" />} className="mt-1 rounded-full">Go to Team</Button>
    </Card>
  );
}
