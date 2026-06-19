"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, CalendarClock, Repeat, ListChecks, PartyPopper, Lock, Unlock } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { AppShell } from "@/components/app-shell";
import { PriorityBadge } from "@/components/task-badges";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  type ScoringTask, taskStatus, isDoneNow, showsToday, isRepeating,
  isBlocked, isReady, formatDue, formatTime, formatTimestamp, scoreTasks,
} from "@/lib/scoring";

export default function StaffView({ userEmail, initialTasks }: { userEmail: string; initialTasks: ScoringTask[] }) {
  const [tasks, setTasks] = useState<ScoringTask[]>(initialTasks);
  const [completing, setCompleting] = useState<Set<string>>(new Set());

  const now = new Date();
  const visible = tasks.filter((t) => showsToday(t, now));
  const blocked = visible.filter((t) => !isDoneNow(t, now) && isBlocked(t));
  const todo = visible.filter((t) => !isDoneNow(t, now) && !isBlocked(t));
  const done = visible.filter((t) => isDoneNow(t, now));
  const stats = useMemo(() => scoreTasks(tasks, now), [tasks]);

  function completeTask(task: ScoringTask) {
    if (completing.has(task.id)) return;
    setCompleting((prev) => new Set(prev).add(task.id));
    setTimeout(async () => {
      const supabase = createClient();
      const completedAt = new Date().toISOString();
      const { error } = await supabase.from("tasks").update({ is_done: true, completed_at: completedAt }).eq("id", task.id);
      setCompleting((prev) => { const n = new Set(prev); n.delete(task.id); return n; });
      if (error) return;
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, is_done: true, completed_at: completedAt } : t)));
    }, 480);
  }

  async function undoTask(task: ScoringTask) {
    const supabase = createClient();
    const { error } = await supabase.from("tasks").update({ is_done: false, completed_at: null }).eq("id", task.id);
    if (error) return;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, is_done: false, completed_at: null } : t)));
  }

  return (
    <AppShell
      role="member"
      userEmail={userEmail}
      title="My work"
      primaryAction={
        <div className="flex items-center gap-3 rounded-full border border-border bg-muted/40 px-3 py-1.5">
          <div className="leading-tight">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">On-time</p>
            <p className="font-heading text-sm font-bold tabular-nums">{stats.score === null ? "—" : `${stats.score}%`}</p>
          </div>
          <div className="h-7 w-px bg-border" />
          <div className="leading-tight">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Today</p>
            <p className="font-heading text-sm font-bold tabular-nums">{stats.doneToday}/{stats.dueTodayTotal}</p>
          </div>
        </div>
      }>
      <div className="mx-auto w-full max-w-2xl space-y-8">
        {visible.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-indigo-600 dark:text-indigo-400">
              <ListChecks className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="font-heading text-lg font-bold">Nothing due today</p>
              <p className="mx-auto max-w-xs text-sm text-muted-foreground">When your admin assigns you a task, it&apos;ll show up here.</p>
            </div>
          </Card>
        ) : (
          <>
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="font-heading text-sm font-bold uppercase tracking-wide">To do</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">{todo.length}</span>
              </div>
              {todo.length === 0 ? (
                <Card className="flex flex-col items-center gap-2 py-10 text-center">
                  <div className="flex size-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                    <PartyPopper className="size-5" />
                  </div>
                  <p className="text-sm font-medium">{blocked.length > 0 ? "Nothing to start yet — see what you're waiting on below." : "All caught up. Nice work."}</p>
                </Card>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  <AnimatePresence mode="popLayout">
                    {todo.map((t) => (
                      <motion.li key={t.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
                        <TaskRow task={t} now={now} completing={completing.has(t.id)} ready={isReady(t)} onComplete={() => completeTask(t)} />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </section>

            {blocked.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h2 className="font-heading text-sm font-bold uppercase tracking-wide">Waiting on others</h2>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">{blocked.length}</span>
                </div>
                <ul className="flex flex-col gap-2.5">
                  <AnimatePresence mode="popLayout">
                    {blocked.map((t) => (
                      <motion.li key={t.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
                        <BlockedRow task={t} />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </section>
            )}

            {done.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h2 className="font-heading text-sm font-bold uppercase tracking-wide">Done today</h2>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">{done.length}</span>
                </div>
                <ul className="flex flex-col gap-2.5">
                  <AnimatePresence mode="popLayout">
                    {done.map((t) => (
                      <motion.li key={t.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                        <DoneRow task={t} onUndo={() => undoTask(t)} />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function TaskRow({ task, now, completing, ready, onComplete }: { task: ScoringTask; now: Date; completing: boolean; ready: boolean; onComplete: () => void }) {
  const overdue = taskStatus(task, now) === "overdue";
  return (
    <Card className={cn(
      "relative flex flex-row items-center gap-3.5 overflow-hidden px-4 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
      completing && "border-emerald-300 bg-emerald-50/70 dark:border-emerald-500/40 dark:bg-emerald-500/10"
    )}>
      <div className={cn("absolute left-0 top-0 h-full w-1", task.importance === "high" ? "bg-red-500" : "bg-indigo-500/40")} />
      <button type="button" onClick={onComplete} aria-label="Mark complete"
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 active:scale-90",
          completing ? "scale-110 border-emerald-500 bg-emerald-500" : "border-muted-foreground/30 hover:border-emerald-500"
        )}>
        <Check className={cn("size-4 text-white transition-transform duration-300", completing ? "scale-100" : "scale-0")} strokeWidth={3} />
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate font-medium transition-all", completing ? "text-muted-foreground line-through" : "text-foreground")}>{task.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
          {isRepeating(task) ? (
            <span className="inline-flex items-center gap-1"><Repeat className="size-3.5" /><span className="capitalize">{task.recurrence}</span> at {formatTime(task.due_time)}</span>
          ) : (
            <span className="inline-flex items-center gap-1"><CalendarClock className="size-3.5" />{formatDue(task)}</span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {ready && !completing && (
          <Badge className="rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"><Unlock className="mr-1 size-3" /> Ready</Badge>
        )}
        {isRepeating(task) && <Badge variant="secondary" className="rounded-full">Repeating</Badge>}
        <PriorityBadge importance={task.importance} />
        {overdue && !completing && (
          <Badge className="rounded-full bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400">Overdue</Badge>
        )}
      </div>
    </Card>
  );
}

function BlockedRow({ task }: { task: ScoringTask }) {
  return (
    <Card className="relative flex flex-row items-center gap-3.5 overflow-hidden px-4 py-3.5 opacity-90">
      <div className="absolute left-0 top-0 h-full w-1 bg-amber-500" />
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-amber-300 bg-amber-50 text-amber-600 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400">
        <Lock className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-muted-foreground">{task.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
          {isRepeating(task) ? (
            <span className="inline-flex items-center gap-1"><Repeat className="size-3.5" /><span className="capitalize">{task.recurrence}</span> at {formatTime(task.due_time)}</span>
          ) : (
            <span className="inline-flex items-center gap-1"><CalendarClock className="size-3.5" />{formatDue(task)}</span>
          )}
          <span>·</span>
          <span className="inline-flex min-w-0 items-center gap-1 text-amber-600 dark:text-amber-400">
            <Lock className="size-3.5 shrink-0" /> <span className="truncate">waiting on {task.block_reason || "another task"}</span>
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <PriorityBadge importance={task.importance} />
        <Badge className="rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">Blocked</Badge>
      </div>
    </Card>
  );
}

function DoneRow({ task, onUndo }: { task: ScoringTask; onUndo: () => void }) {
  return (
    <Card className="flex flex-row items-center gap-3.5 px-4 py-3.5 opacity-80">
      <button type="button" onClick={onUndo} aria-label="Mark not done"
        className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-500 text-white transition-transform duration-150 hover:scale-105 active:scale-90">
        <Check className="size-4" strokeWidth={3} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-muted-foreground line-through">{task.title}</p>
        {task.completed_at && (
          <p className="mt-1 text-[13px] text-muted-foreground">Completed {formatTimestamp(task.completed_at)}</p>
        )}
      </div>
      {isRepeating(task) && <Badge variant="secondary" className="shrink-0 rounded-full">Repeating</Badge>}
    </Card>
  );
}
