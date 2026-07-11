"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  istToday, occursOn, isSkippedOn, isSnoozed, formatTime, formatDateLabel,
  type PersonalTask,
} from "@/lib/personal";

/** External (e.g. Google Calendar) events shown read-only on the grid. */
export interface GridEvent { id: string; title: string; date: string; time?: string; }

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type DayStatus = "done" | "skipped" | "snoozed" | "overdue" | "pending";

function statusOn(task: PersonalTask, dateStr: string, today: string): DayStatus {
  const done = task.recurrence ? task.last_done_on === dateStr : task.is_done;
  if (done) return "done";
  if (isSkippedOn(task, dateStr)) return "skipped";
  if (isSnoozed(task)) return "snoozed";
  if (dateStr < today) return "overdue";
  return "pending";
}

const PILL: Record<DayStatus, string> = {
  pending: "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100/70 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20",
  done: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20",
  snoozed: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100/70 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20",
  skipped: "border-border bg-muted text-muted-foreground hover:bg-muted/70",
  overdue: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100/70 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20",
};

const DOT: Record<DayStatus, string> = {
  pending: "bg-indigo-500",
  done: "bg-emerald-500",
  snoozed: "bg-amber-500",
  skipped: "bg-muted-foreground/50",
  overdue: "bg-rose-500",
};

const LEGEND: { status: DayStatus; label: string }[] = [
  { status: "pending", label: "Pending" },
  { status: "done", label: "Done" },
  { status: "snoozed", label: "Snoozed" },
  { status: "skipped", label: "Skipped" },
  { status: "overdue", label: "Overdue" },
];

export function CalendarGrid({
  tasks, googleEvents = [], onOpenTask, onCreateOnDate,
}: {
  tasks: PersonalTask[];
  googleEvents?: GridEvent[];
  onOpenTask: (t: PersonalTask) => void;
  onCreateOnDate: (dateStr: string) => void;
}) {
  const today = istToday();
  const [y0, m0] = today.split("-").map(Number);
  const [year, setYear] = useState(y0);
  const [month, setMonth] = useState(m0 - 1); // 0-based
  const [selected, setSelected] = useState(today); // drives the mobile day agenda

  function shiftMonth(delta: number) {
    const d = new Date(Date.UTC(year, month + delta, 1));
    setYear(d.getUTCFullYear());
    setMonth(d.getUTCMonth());
  }

  const days = useMemo(() => {
    const first = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const inMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const cells: { dateStr: string; dayNum: number; current: boolean }[] = [];
    for (let i = first - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(year, month, -i));
      cells.push({ dateStr: d.toISOString().slice(0, 10), dayNum: d.getUTCDate(), current: false });
    }
    for (let i = 1; i <= inMonth; i++) {
      const d = new Date(Date.UTC(year, month, i));
      cells.push({ dateStr: d.toISOString().slice(0, 10), dayNum: i, current: true });
    }
    while (cells.length % 7 !== 0) {
      const d = new Date(Date.UTC(year, month + 1, cells.length - first - inMonth + 1));
      cells.push({ dateStr: d.toISOString().slice(0, 10), dayNum: d.getUTCDate(), current: false });
    }
    return cells;
  }, [year, month]);

  const gEventsByDate = useMemo(() => {
    const m = new Map<string, GridEvent[]>();
    for (const e of googleEvents) {
      if (!m.has(e.date)) m.set(e.date, []);
      m.get(e.date)!.push(e);
    }
    return m;
  }, [googleEvents]);

  function tasksOn(dateStr: string): PersonalTask[] {
    return tasks.filter((t) => {
      if (t.recurrence === "interval") return false;
      if (t.recurrence) return occursOn(t, dateStr);
      return t.due_date === dateStr;
    });
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card">
      {/* header */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5">
        <div>
          <h2 className="font-heading text-base font-bold">{MONTHS[month]} {year}</h2>
          <p className="text-xs text-muted-foreground">Tap a date to add a task there</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month"
            className="rounded-xl border border-border p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-95">
            <ChevronLeft className="size-4" />
          </button>
          <button type="button" onClick={() => { setYear(y0); setMonth(m0 - 1); }}
            className="rounded-xl border border-border px-3 py-2 text-xs font-bold transition hover:bg-muted active:scale-95">
            Today
          </button>
          <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month"
            className="rounded-xl border border-border p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-95">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* weekday row */}
      <div className="grid grid-cols-7 border-b border-border py-2 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {WEEKDAYS.map((d) => <div key={d}>{d}</div>)}
      </div>

      {/* days */}
      <div className="grid grid-cols-7 gap-px bg-border">
        {days.map(({ dateStr, dayNum, current }) => {
          const isToday = dateStr === today;
          const dayTasks = tasksOn(dateStr);
          const dayGEvents = gEventsByDate.get(dateStr) ?? [];
          const isSelected = dateStr === selected;
          return (
            <div key={dateStr} onClick={() => setSelected(dateStr)}
              className={cn("group relative flex min-h-[56px] flex-col p-1.5 transition hover:bg-muted/40 sm:min-h-[116px] sm:p-2",
                isToday ? "bg-indigo-50/60 dark:bg-indigo-500/[0.06]" : "bg-card",
                isSelected && "ring-1 ring-inset ring-foreground/40 sm:ring-0")}>
              <div className="mb-1 flex items-center justify-between">
                <span className={cn("inline-flex size-6 items-center justify-center rounded-full text-xs font-bold",
                  isToday ? "bg-foreground text-background" : current ? "text-foreground" : "text-muted-foreground/40")}>
                  {dayNum}
                </span>
                <button type="button" onClick={(e) => { e.stopPropagation(); onCreateOnDate(dateStr); }} aria-label={`Add task on ${dateStr}`}
                  className="hidden size-5 place-items-center rounded-md bg-muted text-muted-foreground opacity-0 transition hover:text-foreground group-hover:opacity-100 sm:grid">
                  <Plus className="size-3" />
                </button>
              </div>

              {/* phones: status dots — pills are unreadable at this size */}
              <div className="flex flex-wrap gap-0.5 sm:hidden">
                {dayTasks.slice(0, 6).map((t) => (
                  <span key={t.id} className={cn("size-1.5 rounded-full", DOT[statusOn(t, dateStr, today)])} />
                ))}
                {dayGEvents.slice(0, Math.max(0, 6 - dayTasks.length)).map((e) => (
                  <span key={e.id} className="size-1.5 rounded-full border border-muted-foreground/60" />
                ))}
              </div>

              {/* larger screens: full pills */}
              <div className="hidden flex-1 space-y-1 overflow-y-auto sm:block">
                {dayTasks.map((t) => {
                  const s = statusOn(t, dateStr, today);
                  return (
                    <button key={t.id} type="button" onClick={(e) => { e.stopPropagation(); onOpenTask(t); }}
                      className={cn("flex w-full flex-col rounded-lg border p-1 px-1.5 text-left text-[10px] font-semibold transition", PILL[s])}
                      title={`${t.title}${t.due_time ? ` · ${formatTime(t.due_time)}` : ""}`}>
                      <span className="truncate leading-tight">{t.title}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-[8px] opacity-75">
                        <span className={cn("size-1 rounded-full", DOT[s])} />
                        {t.due_time ? formatTime(t.due_time) : t.recurrence ? "Repeats" : "All day"}
                      </span>
                    </button>
                  );
                })}
                {dayGEvents.map((e) => (
                  <div key={e.id}
                    className="flex w-full flex-col rounded-lg border border-dashed border-border bg-background p-1 px-1.5 text-left text-[10px] font-semibold text-muted-foreground"
                    title={`${e.title} (Google Calendar)`}>
                    <span className="truncate leading-tight">{e.title}</span>
                    <span className="mt-0.5 text-[8px] opacity-75">{e.time ?? "All day"} · Google</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* phones: agenda for the tapped day */}
      <div className="border-t border-border p-3 sm:hidden">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-heading text-sm font-bold">{formatDateLabel(selected, today)}</h3>
          <button type="button" onClick={() => onCreateOnDate(selected)}
            className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition hover:text-foreground">
            <Plus className="size-3" /> Add task
          </button>
        </div>
        {(() => {
          const dayTasks = tasksOn(selected);
          const dayGEvents = gEventsByDate.get(selected) ?? [];
          if (dayTasks.length + dayGEvents.length === 0) {
            return <p className="py-2 text-sm text-muted-foreground">Nothing on this day.</p>;
          }
          return (
            <div className="space-y-1.5">
              {dayTasks.map((t) => {
                const s = statusOn(t, selected, today);
                return (
                  <button key={t.id} type="button" onClick={() => onOpenTask(t)}
                    className="flex w-full items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5 text-left">
                    <span className={cn("size-2 shrink-0 rounded-full", DOT[s])} />
                    <span className={cn("min-w-0 flex-1 truncate text-sm font-medium", s === "done" && "text-muted-foreground line-through")}>{t.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {t.due_time ? formatTime(t.due_time) : t.recurrence ? "Repeats" : ""}
                    </span>
                  </button>
                );
              })}
              {dayGEvents.map((e) => (
                <div key={e.id} className="flex w-full items-center gap-2.5 rounded-xl border border-dashed border-border bg-card/50 px-3 py-2.5">
                  <span className="size-2 shrink-0 rounded-full border border-muted-foreground/60" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground">{e.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{e.time ?? "All day"}</span>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* legend */}
      <div className="hidden flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border-t border-border px-4 py-3 text-xs font-medium text-muted-foreground sm:flex">
        {LEGEND.map(({ status, label }) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", DOT[status])} /> {label}
          </span>
        ))}
      </div>
    </div>
  );
}
