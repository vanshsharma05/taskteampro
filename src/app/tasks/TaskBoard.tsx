"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Check, Clock, Repeat, Flag, Trash2, Menu, X, LogOut,
  Sun, CalendarDays, CalendarRange, CheckSquare, User, Building2,
  AlarmClock, Ban, FileText, RefreshCw, type LucideIcon,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { AddTaskSheet } from "@/components/add-task-sheet";
import { TaskDetailSheet } from "@/components/task-detail-sheet";
import { DailyDigest } from "@/components/daily-digest";
import { CalendarGrid } from "@/components/calendar-grid";
import { Reminders } from "@/components/reminders";
import { useGoogleCalendar } from "@/components/use-google-calendar";
import { deleteGoogleEvent } from "@/lib/google-calendar";
import { cn } from "@/lib/utils";
import {
  DEFAULT_CATEGORIES, categoryIcon, istToday, occursOn, isCheckedOn,
  isOverdue, isSnoozed, isSkippedOn, subtaskProgress, formatSnoozeUntil,
  formatTime, formatDateLabel, describeRepeat,
  type PersonalTask,
} from "@/lib/personal";

type View = "today" | "upcoming" | "calendar";
type Incoming = Partial<PersonalTask> & { id: string; title: string };

function istDateOf(ts: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(ts));
}

function normalize(t: Incoming): PersonalTask {
  return {
    id: t.id, title: t.title,
    description: t.description ?? null,
    category: t.category ?? null,
    importance: t.importance ?? "normal",
    due_date: t.due_date ?? null,
    due_time: t.due_time ?? null,
    recurrence: t.recurrence ?? null,
    repeat_days: t.repeat_days ?? null,
    repeat_dom: t.repeat_dom ?? null,
    repeat_every_min: t.repeat_every_min ?? null,
    window_start: t.window_start ?? null,
    window_end: t.window_end ?? null,
    is_done: t.is_done ?? false,
    last_done_on: t.last_done_on ?? null,
    completed_at: t.completed_at ?? null,
    snoozed_until: t.snoozed_until ?? null,
    skipped_on: t.skipped_on ?? null,
    subtasks: t.subtasks ?? [],
    google_event_id: t.google_event_id ?? null,
  };
}

export default function TaskBoard({
  userId, userEmail, initialTasks,
}: { userId: string; userEmail: string; initialTasks: Incoming[] }) {
  const router = useRouter();
  const today = istToday();

  const [tasks, setTasks] = useState<PersonalTask[]>(() => (initialTasks ?? []).map(normalize));
  const [view, setView] = useState<View>("today");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addDate, setAddDate] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [workHref, setWorkHref] = useState<string | null>(null);
  const gcal = useGoogleCalendar();

  const detailTask = detailId ? tasks.find((t) => t.id === detailId) ?? null : null;

  // hide Google copies of events we pushed ourselves — the task row already shows them
  const googleEvents = useMemo(() => {
    const pushed = new Set(tasks.map((t) => t.google_event_id).filter(Boolean) as string[]);
    return gcal.events.filter((e) => !pushed.has(e.id.split(":").pop() ?? ""));
  }, [gcal.events, tasks]);

  // re-render every minute so expired snoozes surface without a reload
  const [, setNowTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setNowTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // business account → show the Work switch
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await createClient()
        .from("profiles").select("account_type, role").eq("id", userId).single();
      if (active && data?.account_type === "business")
        setWorkHref(data.role === "admin" ? "/admin" : "/staff");
    })();
    return () => { active = false; };
  }, [userId]);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of tasks) if (t.category) m[t.category] = (m[t.category] ?? 0) + 1;
    return m;
  }, [tasks]);

  const customCategories = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.category).filter(Boolean) as string[]))
      .filter((c) => !DEFAULT_CATEGORIES.some((d) => d.name.toLowerCase() === c.toLowerCase())),
    [tasks],
  );

  const inCat = (t: PersonalTask) => !activeCategory || (t.category ?? "") === activeCategory;

  // TODAY buckets
  const activeToday = (t: PersonalTask) => {      // due today (or anytime) and not done
    if (isCheckedOn(t, today)) return false;
    if (t.recurrence) return occursOn(t, today);
    if (!t.due_date) return !t.is_done;          // "anytime" task
    return t.due_date === today;
  };
  const overdue = tasks.filter(inCat).filter((t) => isOverdue(t, today) && !isSnoozed(t));
  const todo = tasks.filter(inCat).filter((t) => activeToday(t) && !isSnoozed(t) && !isSkippedOn(t, today));
  const snoozed = tasks.filter(inCat).filter((t) => isSnoozed(t) && (activeToday(t) || isOverdue(t, today)));
  const skippedToday = tasks.filter(inCat).filter((t) => !isSnoozed(t) && isSkippedOn(t, today) && (t.recurrence ? occursOn(t, today) : !t.is_done));
  const doneToday = tasks.filter(inCat).filter((t) =>
    t.recurrence ? t.last_done_on === today
      : t.is_done && !!t.completed_at && istDateOf(t.completed_at) === today,
  );

  // UPCOMING
  const upcoming = tasks.filter(inCat)
    .filter((t) => !t.recurrence && t.due_date && t.due_date > today && !t.is_done && !t.skipped_on)
    .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1));
  const upcomingByDate = useMemo(() => {
    const m = new Map<string, PersonalTask[]>();
    for (const t of upcoming) { const k = t.due_date!; if (!m.has(k)) m.set(k, []); m.get(k)!.push(t); }
    return Array.from(m.entries());
  }, [upcoming]);
  const repeating = tasks.filter(inCat).filter((t) => !!t.recurrence);

  async function toggleTask(task: PersonalTask) {
    const checked = isCheckedOn(task, today);
    if (task.recurrence) {
      const updates = { last_done_on: checked ? null : today, snoozed_until: null, skipped_on: null };
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...updates } : t)));
      await createClient().from("tasks").update(updates).eq("id", task.id);
    } else {
      const done = !checked;
      const updates = {
        is_done: done, completed_at: done ? new Date().toISOString() : null,
        snoozed_until: null, skipped_on: null,
      };
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...updates } : t)));
      await createClient().from("tasks").update({ ...updates, status: done ? "done" : "pending" }).eq("id", task.id);
    }
  }

  function updateTask(next: PersonalTask) {
    setTasks((prev) => prev.map((t) => (t.id === next.id ? next : t)));
  }

  async function deleteTask(task: PersonalTask) {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    await createClient().from("tasks").delete().eq("id", task.id);
    if (task.google_event_id) {
      await deleteGoogleEvent(task.google_event_id);   // best-effort cleanup on Google
      void gcal.refresh();
    }
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login"); router.refresh();
  }

  const doneCount = doneToday.length;
  const totalToday = todo.length + doneCount;

  const sidebar = (onNavigate?: () => void) => (
    <BoardSidebar
      view={view} onView={(v) => { setView(v); onNavigate?.(); }}
      activeCategory={activeCategory}
      onCategory={(c) => { setActiveCategory((p) => (p === c ? null : c)); onNavigate?.(); }}
      customCategories={customCategories} counts={counts}
      workHref={workHref} userEmail={userEmail} onSignOut={signOut} onNavigate={onNavigate}
    />
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card px-3 py-5 md:flex">
        {sidebar()}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div key="backdrop" className="fixed inset-0 z-40 bg-black/40 md:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
            <motion.aside key="drawer" className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card px-3 py-5 md:hidden"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 320, damping: 32 }}>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu"
                className="absolute right-3 top-4 rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground">
                <X className="size-4" />
              </button>
              {sidebar(() => setMobileOpen(false))}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-border px-5 py-3.5">
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu"
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground md:hidden">
            <Menu className="size-5" />
          </button>
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight">
              {view === "today" ? "Today" : view === "upcoming" ? "Upcoming" : "Calendar"}
            </h1>
            {view === "today" && (
              <p className="text-xs text-muted-foreground">
                {totalToday === 0 ? "Nothing scheduled" : `${doneCount} of ${totalToday} done`}
                {overdue.length > 0 && <span className="text-red-600 dark:text-red-400"> · {overdue.length} overdue</span>}
                {snoozed.length > 0 && <span className="text-amber-600 dark:text-amber-400"> · {snoozed.length} snoozed</span>}
              </p>
            )}
          </div>
          <button onClick={() => setAddOpen(true)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-sm transition hover:bg-foreground/90 active:scale-[0.97]">
            <Plus className="size-4" /> Add task
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <div className={cn("mx-auto w-full", view === "calendar" ? "max-w-5xl" : "max-w-2xl")}>
            <Reminders tasks={tasks} />
            {view === "today" && (
              <>
                <DailyDigest pending={todo} doneCount={doneToday.length} overdueCount={overdue.length} />
                <TodayView overdue={overdue} todo={todo} snoozed={snoozed} skipped={skippedToday} doneToday={doneToday}
                  today={today} onToggle={toggleTask} onDelete={deleteTask} onOpen={(t) => setDetailId(t.id)} onAdd={() => setAddOpen(true)} />
                <GoogleToday gcal={gcal} events={googleEvents} today={today} />
              </>
            )}
            {view === "upcoming" && (
              <UpcomingView byDate={upcomingByDate} repeating={repeating}
                today={today} onToggle={toggleTask} onDelete={deleteTask} onOpen={(t) => setDetailId(t.id)} />
            )}
            {view === "calendar" && (
              <div className="space-y-4">
                <CalendarGrid tasks={tasks.filter(inCat)}
                  googleEvents={googleEvents.map((e) => ({ id: e.id, title: e.title, date: e.date, time: e.time }))}
                  onOpenTask={(t) => setDetailId(t.id)}
                  onCreateOnDate={(d) => { setAddDate(d); setAddOpen(true); }} />
                <GoogleConnectCard gcal={gcal} />
              </div>
            )}
          </div>
        </div>
      </div>

      <AddTaskSheet open={addOpen} onClose={() => { setAddOpen(false); setAddDate(null); }} userId={userId}
        knownCategories={customCategories} initialDate={addDate}
        onCreated={(t) => setTasks((prev) => [t, ...prev])} />

      <TaskDetailSheet task={detailTask} onClose={() => setDetailId(null)}
        onUpdated={updateTask} onDelete={deleteTask} />
    </div>
  );
}

function Section({ title, count, tone, children }: {
  title: string; count: number; tone?: "red" | "emerald" | "amber"; children: React.ReactNode;
}) {
  const toneCls = tone === "red" ? "text-red-600 dark:text-red-400"
    : tone === "emerald" ? "text-emerald-600 dark:text-emerald-400"
    : tone === "amber" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground";
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <h2 className={cn("font-heading text-xs font-bold uppercase tracking-wider", toneCls)}>{title}</h2>
        <span className="text-xs font-semibold tabular-nums text-muted-foreground">{count}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function TodayView({ overdue, todo, snoozed, skipped, doneToday, today, onToggle, onDelete, onOpen, onAdd }: {
  overdue: PersonalTask[]; todo: PersonalTask[]; snoozed: PersonalTask[]; skipped: PersonalTask[];
  doneToday: PersonalTask[]; today: string;
  onToggle: (t: PersonalTask) => void; onDelete: (t: PersonalTask) => void;
  onOpen: (t: PersonalTask) => void; onAdd: () => void;
}) {
  if (overdue.length + todo.length + snoozed.length + skipped.length + doneToday.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border py-20 text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-muted text-indigo-600 dark:text-indigo-400"><Sun className="size-6" /></div>
        <div className="space-y-1">
          <p className="font-heading text-lg font-bold">Your day is clear</p>
          <p className="mx-auto max-w-xs text-sm text-muted-foreground">Add a task or a daily reminder to get started.</p>
        </div>
        <button onClick={onAdd} className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:bg-foreground/90"><Plus className="size-4" /> Add task</button>
      </div>
    );
  }
  return (
    <div className="space-y-7">
      {overdue.length > 0 && (
        <Section title="Overdue" tone="red" count={overdue.length}>
          {overdue.map((t) => <TaskItem key={t.id} task={t} today={today} icon={categoryIcon(t.category)} onToggle={() => onToggle(t)} onDelete={() => onDelete(t)} onOpen={() => onOpen(t)} />)}
        </Section>
      )}
      <Section title="To do" count={todo.length}>
        {todo.length === 0
          ? <p className="px-1 text-sm text-muted-foreground">All done for today. Nice.</p>
          : todo.map((t) => <TaskItem key={t.id} task={t} today={today} icon={categoryIcon(t.category)} onToggle={() => onToggle(t)} onDelete={() => onDelete(t)} onOpen={() => onOpen(t)} />)}
      </Section>
      {snoozed.length > 0 && (
        <Section title="Snoozed" tone="amber" count={snoozed.length}>
          {snoozed.map((t) => <TaskItem key={t.id} task={t} today={today} icon={categoryIcon(t.category)} onToggle={() => onToggle(t)} onDelete={() => onDelete(t)} onOpen={() => onOpen(t)} />)}
        </Section>
      )}
      {skipped.length > 0 && (
        <Section title="Skipped" count={skipped.length}>
          {skipped.map((t) => <TaskItem key={t.id} task={t} today={today} icon={categoryIcon(t.category)} onToggle={() => onToggle(t)} onDelete={() => onDelete(t)} onOpen={() => onOpen(t)} />)}
        </Section>
      )}
      {doneToday.length > 0 && (
        <Section title="Completed" tone="emerald" count={doneToday.length}>
          {doneToday.map((t) => <TaskItem key={t.id} task={t} today={today} icon={categoryIcon(t.category)} onToggle={() => onToggle(t)} onDelete={() => onDelete(t)} onOpen={() => onOpen(t)} />)}
        </Section>
      )}
    </div>
  );
}

function UpcomingView({ byDate, repeating, today, onToggle, onDelete, onOpen }: {
  byDate: [string, PersonalTask[]][]; repeating: PersonalTask[]; today: string;
  onToggle: (t: PersonalTask) => void; onDelete: (t: PersonalTask) => void; onOpen: (t: PersonalTask) => void;
}) {
  if (byDate.length === 0 && repeating.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border py-20 text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-muted text-indigo-600 dark:text-indigo-400"><CalendarDays className="size-6" /></div>
        <div className="space-y-1">
          <p className="font-heading text-lg font-bold">Nothing coming up</p>
          <p className="mx-auto max-w-xs text-sm text-muted-foreground">Future-dated tasks and your repeating reminders show up here.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-7">
      {byDate.map(([date, items]) => (
        <Section key={date} title={formatDateLabel(date, today)} count={items.length}>
          {items.map((t) => <TaskItem key={t.id} task={t} today={today} icon={categoryIcon(t.category)} onToggle={() => onToggle(t)} onDelete={() => onDelete(t)} onOpen={() => onOpen(t)} />)}
        </Section>
      ))}
      {repeating.length > 0 && (
        <Section title="Repeating reminders" count={repeating.length}>
          {repeating.map((t) => <TaskItem key={t.id} task={t} today={today} icon={categoryIcon(t.category)} hideCheck onToggle={() => onToggle(t)} onDelete={() => onDelete(t)} onOpen={() => onOpen(t)} />)}
        </Section>
      )}
    </div>
  );
}

function TaskItem({ task, today, hideCheck, icon: Icon, onToggle, onDelete, onOpen }: {
  task: PersonalTask; today: string; hideCheck?: boolean; icon: LucideIcon;
  onToggle: () => void; onDelete: () => void; onOpen: () => void;
}) {
  const checked = isCheckedOn(task, today);
  const overdue = isOverdue(task, today);
  const snoozedNow = isSnoozed(task);
  const skippedNow = isSkippedOn(task, today);
  const repeatLabel = describeRepeat(task);
  const high = task.importance === "high";
  const subs = subtaskProgress(task);
  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 transition hover:border-foreground/20">
      {!hideCheck ? (
        <button type="button" onClick={onToggle} aria-label={checked ? "Mark not done" : "Mark done"}
          className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2 transition active:scale-90",
            checked ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground/30 hover:border-emerald-500")}>
          <Check className={cn("size-3.5 transition-transform", checked ? "scale-100" : "scale-0")} strokeWidth={3} />
        </button>
      ) : (
        <div className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-indigo-600 dark:text-indigo-400"><Repeat className="size-3" /></div>
      )}
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 cursor-pointer text-left">
        <p className={cn("truncate text-[15px] font-medium", (checked || skippedNow) && "text-muted-foreground line-through")}>{task.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[12px] text-muted-foreground">
          {task.due_time && <span className="inline-flex items-center gap-1"><Clock className="size-3" />{formatTime(task.due_time)}</span>}
          {task.category && <span className="inline-flex items-center gap-1"><Icon className="size-3" />{task.category}</span>}
          {repeatLabel && <span className="inline-flex items-center gap-1"><Repeat className="size-3" />{repeatLabel}</span>}
          {subs.total > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1 w-10 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${(subs.done / subs.total) * 100}%` }} />
              </span>
              {subs.done}/{subs.total}
            </span>
          )}
          {task.description && <FileText className="size-3" aria-label="Has notes" />}
          {snoozedNow && task.snoozed_until && (
            <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
              <AlarmClock className="size-3" />{formatSnoozeUntil(task.snoozed_until)}
            </span>
          )}
          {skippedNow && <span className="inline-flex items-center gap-1 font-semibold"><Ban className="size-3" />Skipped</span>}
          {overdue && !snoozedNow && <span className="font-semibold text-red-600 dark:text-red-400">Overdue</span>}
        </div>
      </button>
      {high && <Flag className="size-3.5 shrink-0 text-amber-500" />}
      <button type="button" onClick={onDelete} aria-label="Delete task"
        className="shrink-0 rounded-md p-1 text-muted-foreground/50 transition hover:bg-muted hover:text-red-600">
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

/** Read-only "what's on your Google Calendar today" section for the Today view. */
function GoogleToday({ gcal, events, today }: {
  gcal: ReturnType<typeof useGoogleCalendar>;
  events: ReturnType<typeof useGoogleCalendar>["events"];
  today: string;
}) {
  if (!gcal.available) return null;
  if (!gcal.connected) {
    return (
      <div className="mt-7 flex items-center gap-3 rounded-2xl border border-dashed border-border px-4 py-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-indigo-600 dark:text-indigo-400">
          <CalendarDays className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">See your Google Calendar here</p>
          <p className="text-xs text-muted-foreground">Read-only — your events show up next to your tasks.</p>
        </div>
        <button type="button" onClick={gcal.connect} disabled={gcal.connecting}
          className="shrink-0 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition hover:bg-foreground/90 disabled:opacity-50">
          {gcal.connecting ? "Connecting…" : "Connect"}
        </button>
      </div>
    );
  }
  const todaysEvents = events.filter((e) => e.date === today);
  return (
    <div className="mt-7 space-y-2">
      <div className="flex items-center gap-2 px-1">
        <h2 className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">Google Calendar</h2>
        <span className="text-xs font-semibold tabular-nums text-muted-foreground">{todaysEvents.length}</span>
        <button type="button" onClick={gcal.refresh} aria-label="Refresh Google Calendar"
          className="ml-auto rounded-md p-1 text-muted-foreground/60 transition hover:bg-muted hover:text-foreground">
          <RefreshCw className="size-3.5" />
        </button>
      </div>
      {gcal.error && <p className="px-1 text-xs text-red-600 dark:text-red-400">{gcal.error}</p>}
      {todaysEvents.length === 0
        ? <p className="px-1 text-sm text-muted-foreground">No events on your calendar today.</p>
        : todaysEvents.map((e) => (
          <div key={e.id} className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-4 py-3">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: e.color ?? "#6366f1" }} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium">{e.title}</p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {e.time ? `${e.time}${e.endTime ? ` – ${e.endTime}` : ""}` : "All day"} · {e.calendarName}
              </p>
            </div>
          </div>
        ))}
    </div>
  );
}

/** Connect / status card shown under the calendar grid. */
function GoogleConnectCard({ gcal }: { gcal: ReturnType<typeof useGoogleCalendar> }) {
  if (!gcal.available) return null;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-indigo-600 dark:text-indigo-400">
        <CalendarDays className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Google Calendar</p>
        <p className="text-xs text-muted-foreground">
          {gcal.connected ? `Connected — ${gcal.events.length} events synced (read-only).` : "Show your Google events on this calendar."}
        </p>
        {gcal.error && <p className="text-xs text-red-600 dark:text-red-400">{gcal.error}</p>}
      </div>
      {gcal.connected ? (
        <>
          <button type="button" onClick={gcal.refresh} aria-label="Refresh"
            className="shrink-0 rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground">
            <RefreshCw className="size-4" />
          </button>
          <button type="button" onClick={gcal.disconnect}
            className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground">
            Disconnect
          </button>
        </>
      ) : (
        <button type="button" onClick={gcal.connect} disabled={gcal.connecting}
          className="shrink-0 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition hover:bg-foreground/90 disabled:opacity-50">
          {gcal.connecting ? "Connecting…" : "Connect"}
        </button>
      )}
    </div>
  );
}

function BoardSidebar({
  view, onView, activeCategory, onCategory, customCategories, counts, workHref, userEmail, onSignOut, onNavigate,
}: {
  view: View; onView: (v: View) => void; activeCategory: string | null; onCategory: (c: string) => void;
  customCategories: string[]; counts: Record<string, number>; workHref: string | null;
  userEmail: string; onSignOut: () => void; onNavigate?: () => void;
}) {
  const cats = [
    ...DEFAULT_CATEGORIES.map((c) => ({ name: c.name, Icon: c.Icon })),
    ...customCategories.map((c) => ({ name: c, Icon: categoryIcon(c) })),
  ];
  return (
    <>
      <div className="flex items-center gap-2.5 px-2">
        <div className="grid size-9 place-items-center rounded-xl bg-foreground text-background"><CheckSquare className="size-5" /></div>
        <div className="leading-tight">
          <p className="font-heading text-base font-bold tracking-tight">TeamTaskPro</p>
          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">Personal</span>
        </div>
      </div>

      {workHref && (
        <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/40 p-1">
          <span className="flex items-center justify-center gap-1.5 rounded-lg bg-background px-2 py-1.5 text-xs font-semibold text-foreground shadow-sm"><User className="size-3.5" /> Personal</span>
          <Link href={workHref} onClick={onNavigate} className="flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"><Building2 className="size-3.5" /> Work</Link>
        </div>
      )}

      <nav className={cn("space-y-1", workHref ? "mt-6" : "mt-7")}>
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Menu</p>
        <NavBtn active={view === "today"} onClick={() => onView("today")} icon={Sun} label="Today" />
        <NavBtn active={view === "upcoming"} onClick={() => onView("upcoming")} icon={CalendarDays} label="Upcoming" />
        <NavBtn active={view === "calendar"} onClick={() => onView("calendar")} icon={CalendarRange} label="Calendar" />
      </nav>

      <div className="mt-6 space-y-1">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Categories</p>
        {cats.map(({ name, Icon }) => (
          <button key={name} onClick={() => onCategory(name)}
            className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
              activeCategory === name ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60")}>
            <Icon className="size-4" />
            <span className="flex-1 text-left">{name}</span>
            <span className="rounded-full bg-muted px-1.5 text-[11px] tabular-nums text-muted-foreground">{counts[name] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="mt-auto space-y-2 pt-6">
        <div className="flex items-center gap-2 rounded-lg px-2 py-2">
          <div className="grid size-9 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{(userEmail || "?").slice(0, 2).toUpperCase()}</div>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{userEmail}</p><p className="text-[11px] text-muted-foreground">Personal space</p></div>
          <ThemeToggle />
        </div>
        <button onClick={onSignOut} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent/60 hover:text-foreground"><LogOut className="size-4" /> Sign out</button>
      </div>
    </>
  );
}

function NavBtn({ active, onClick, icon: Icon, label }: {
  active: boolean; onClick: () => void; icon: typeof Sun; label: string;
}) {
  return (
    <button onClick={onClick}
      className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
        active ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:bg-accent/60")}>
      <Icon className="size-4" /> {label}
    </button>
  );
}
