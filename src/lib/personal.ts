import {
  HeartPulse, Home, ShoppingBag, Wallet, Briefcase, User, type LucideIcon,
} from "lucide-react";

export type Recurrence = "daily" | "weekly" | "monthly" | "interval" | null;

export interface SubTask { id: string; text: string; done: boolean; }

export interface PersonalTask {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  importance: "normal" | "high";
  due_date: string | null;
  due_time: string | null;
  recurrence: Recurrence;
  repeat_days: number[] | null;
  repeat_dom: number | null;
  repeat_every_min: number | null;  // interval: minutes between nudges
  window_start: string | null;      // interval: "HH:MM"
  window_end: string | null;        // interval: "HH:MM"
  is_done: boolean;
  last_done_on: string | null;
  completed_at: string | null;
  snoozed_until: string | null;   // ISO timestamp; hidden from To do until then
  skipped_on: string | null;      // one-off: any value = skipped; recurring: skips that day
  subtasks: SubTask[] | null;
  google_event_id: string | null; // Google Calendar event we pushed for this task
}

export interface CategoryDef { name: string; Icon: LucideIcon; }

export const DEFAULT_CATEGORIES: CategoryDef[] = [
  { name: "Health",   Icon: HeartPulse },
  { name: "Home",     Icon: Home },
  { name: "Errands",  Icon: ShoppingBag },
  { name: "Money",    Icon: Wallet },
  { name: "Work",     Icon: Briefcase },
  { name: "Personal", Icon: User },
];

export function categoryIcon(name: string | null): LucideIcon {
  const found = DEFAULT_CATEGORIES.find((c) => c.name.toLowerCase() === (name ?? "").toLowerCase());
  return found?.Icon ?? User;
}

export function istToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

export function dayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export function occursOn(task: PersonalTask, dateStr: string): boolean {
  if (task.recurrence === "interval") return false;       // shown/managed separately
  if (!task.recurrence) return task.due_date === dateStr;
  if (task.recurrence === "daily") return true;
  if (task.recurrence === "weekly") return (task.repeat_days ?? []).includes(dayOfWeek(dateStr));
  if (task.recurrence === "monthly") {
    const dom = task.repeat_dom ?? (task.due_date ? Number(task.due_date.split("-")[2]) : null);
    return dom != null && dom === Number(dateStr.split("-")[2]);
  }
  return false;
}

export function isCheckedOn(task: PersonalTask, dateStr: string): boolean {
  return task.recurrence ? task.last_done_on === dateStr : task.is_done;
}

export function isOverdue(task: PersonalTask, today: string): boolean {
  return !task.recurrence && !task.is_done && !isSkippedOn(task, today) && !!task.due_date && task.due_date < today;
}

export function isSnoozed(task: PersonalTask, now: Date = new Date()): boolean {
  return !!task.snoozed_until && new Date(task.snoozed_until).getTime() > now.getTime();
}

export function isSkippedOn(task: PersonalTask, dateStr: string): boolean {
  if (!task.skipped_on) return false;
  return task.recurrence ? task.skipped_on === dateStr : true;
}

export function subtaskProgress(task: PersonalTask): { done: number; total: number } {
  const subs = task.subtasks ?? [];
  return { done: subs.filter((s) => s.done).length, total: subs.length };
}

export function formatSnoozeUntil(iso: string): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  return day === istToday() ? time : `${formatDateLabel(day, istToday())}, ${time}`;
}

export function formatTime(t: string | null): string {
  if (!t) return "";
  const [hStr, mStr] = t.split(":");
  let h = Number(hStr);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${mStr ?? "00"} ${ampm}`;
}

export function formatDateLabel(dateStr: string, today: string): string {
  if (dateStr === today) return "Today";
  if (dateStr === addDays(today, 1)) return "Tomorrow";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", timeZone: "UTC",
  });
}

export function describeRepeat(task: PersonalTask): string {
  if (!task.recurrence) return "";
  if (task.recurrence === "daily") return "Every day";
  if (task.recurrence === "interval") {
    const m = task.repeat_every_min ?? 0;
    const every = m % 60 === 0 ? `${m / 60} hr` : `${m} min`;
    const win = task.window_start && task.window_end ? `, ${formatTime(task.window_start)}–${formatTime(task.window_end)}` : "";
    return `Every ${every}${win}`;
  }
  if (task.recurrence === "weekly") {
    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const days = (task.repeat_days ?? []).slice().sort((a, b) => a - b).map((d) => names[d]);
    return days.length ? days.join(", ") : "Weekly";
  }
  const dom = task.repeat_dom ?? (task.due_date ? Number(task.due_date.split("-")[2]) : null);
  return dom ? `Monthly on the ${ordinal(dom)}` : "Monthly";
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
