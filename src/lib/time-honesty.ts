import { addDays, occursOn, isOverdue, type PersonalTask } from "@/lib/personal";
import type { GoogleEvent } from "@/lib/google-calendar";

// The honesty layer: personal estimation bias, time debt, and week load.

export const DEFAULT_TASK_MIN = 30;   // assumed size of an unestimated task
const MIN_SAMPLES = 3;                // don't claim a bias from thin data

export interface BiasReport {
  overall: number | null;                       // actual/estimate ratio, e.g. 1.4 = you underestimate
  byCategory: { category: string; ratio: number; samples: number }[];
  samples: number;
}

/** Personal Estimation Bias: learned from completed tasks with both numbers. */
export function estimationBias(tasks: PersonalTask[]): BiasReport {
  const done = tasks.filter((t) => t.estimate_min && t.actual_min && t.estimate_min > 0);
  const ratios = done.map((t) => ({
    category: t.category ?? "Uncategorized",
    ratio: t.actual_min! / t.estimate_min!,
  }));

  const overall = ratios.length >= MIN_SAMPLES
    ? ratios.reduce((s, r) => s + r.ratio, 0) / ratios.length
    : null;

  const byCat = new Map<string, number[]>();
  for (const r of ratios) {
    if (!byCat.has(r.category)) byCat.set(r.category, []);
    byCat.get(r.category)!.push(r.ratio);
  }
  const byCategory = Array.from(byCat.entries())
    .filter(([, rs]) => rs.length >= MIN_SAMPLES)
    .map(([category, rs]) => ({
      category,
      ratio: rs.reduce((s, x) => s + x, 0) / rs.length,
      samples: rs.length,
    }))
    .sort((a, b) => Math.abs(b.ratio - 1) - Math.abs(a.ratio - 1));

  return { overall, byCategory, samples: ratios.length };
}

/** The calendar-honest duration: your estimate × your personal multiplier. */
export function realisticMinutes(task: PersonalTask, bias: BiasReport): number {
  const base = task.estimate_min ?? DEFAULT_TASK_MIN;
  const cat = bias.byCategory.find((c) => c.category === (task.category ?? "Uncategorized"));
  const mult = cat?.ratio ?? bias.overall ?? 1;
  return Math.round(base * mult);
}

export interface DebtItem { task: PersonalTask; minutes: number; daysOld: number; }

/** Time Debt: overdue work is a balance, not a disappearance. */
export function timeDebt(tasks: PersonalTask[], today: string, bias: BiasReport): { totalMin: number; items: DebtItem[] } {
  const items = tasks
    .filter((t) => isOverdue(t, today))
    .map((t) => ({
      task: t,
      minutes: realisticMinutes(t, bias),
      daysOld: Math.max(1, Math.round((Date.parse(today) - Date.parse(t.due_date!)) / 86400_000)),
    }))
    .sort((a, b) => b.daysOld - a.daysOld);
  return { totalMin: items.reduce((s, i) => s + i.minutes, 0), items };
}

export type DayLoadLevel = "clear" | "busy" | "storm";
export interface DayLoad {
  date: string;
  taskMin: number;
  eventMin: number;
  level: DayLoadLevel;
  taskCount: number;
}

const BUSY_MIN = 4 * 60;    // > 4h of scheduled work: busy
const STORM_MIN = 6.5 * 60; // > 6.5h: realistically overloaded

function eventMinutes(e: GoogleEvent): number {
  if (!e.time || !e.endTime) return e.time ? 60 : 0;   // timed w/o end: assume 1h; all-day: 0
  const parse = (s: string) => {
    const m = s.match(/(\d{1,2})[:.](\d{2})\s*(am|pm)?/i);
    if (!m) return null;
    let h = Number(m[1]);
    const meridiem = m[3]?.toLowerCase();
    if (meridiem === "pm" && h < 12) h += 12;
    if (meridiem === "am" && h === 12) h = 0;
    return h * 60 + Number(m[2]);
  };
  const a = parse(e.time), b = parse(e.endTime);
  return a != null && b != null && b > a ? b - a : 60;
}

/** Week Forecast: predicted load for the next 7 days from tasks + calendar. */
export function weekForecast(
  tasks: PersonalTask[], events: GoogleEvent[], today: string, bias: BiasReport,
): DayLoad[] {
  const days: DayLoad[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(today, i);
    const dayTasks = tasks.filter((t) => {
      if (t.recurrence === "interval") return false;
      if (t.recurrence) return occursOn(t, date);
      if (t.is_done) return false;
      // overdue work lands on today's plate
      return t.due_date === date || (i === 0 && !!t.due_date && t.due_date < today);
    });
    const taskMin = dayTasks.reduce((s, t) => s + realisticMinutes(t, bias), 0);
    const eventMin = events.filter((e) => e.date === date).reduce((s, e) => s + eventMinutes(e), 0);
    const total = taskMin + eventMin;
    days.push({
      date, taskMin, eventMin, taskCount: dayTasks.length,
      level: total >= STORM_MIN ? "storm" : total >= BUSY_MIN ? "busy" : "clear",
    });
  }
  return days;
}

/** Stale tasks that qualify for the bankruptcy ritual. */
export function staleTasks(tasks: PersonalTask[], today: string): PersonalTask[] {
  return tasks
    .filter((t) => !t.recurrence && !t.is_done)
    .filter((t) => {
      const veryOverdue = !!t.due_date && t.due_date < addDays(today, -14);
      return t.reschedule_count >= 3 || veryOverdue;
    })
    .sort((a, b) => b.reschedule_count - a.reschedule_count);
}

export function formatMin(min: number): string {
  if (min < 60) return `${min}m`;
  const h = min / 60;
  return `${h % 1 === 0 ? h : h.toFixed(1)}h`;
}
