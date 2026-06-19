import {
  HeartPulse, Home, ShoppingBag, Wallet, Briefcase, User,
  type LucideIcon,
} from "lucide-react";

/* ---------- Task shape (personal) ---------- */
export type Recurrence = "daily" | "weekly" | "monthly" | null;

export interface PersonalTask {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  importance: "normal" | "high";
  due_date: string | null;       // YYYY-MM-DD
  due_time: string | null;       // HH:MM (24h) or HH:MM:SS
  recurrence: Recurrence;        // null = one-time
  repeat_days: number[] | null;  // weekly: 0=Sun … 6=Sat
  repeat_dom: number | null;     // monthly: 1–31
  is_done: boolean;              // one-time completion
  last_done_on: string | null;   // recurring: date last completed (YYYY-MM-DD)
  completed_at: string | null;
}

/* ---------- Categories ---------- */
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
  const found = DEFAULT_CATEGORIES.find(
    (c) => c.name.toLowerCase() === (name ?? "").toLowerCase(),
  );
  return found?.Icon ?? User;
}

/* ---------- IST date helpers (deterministic) ---------- */
// Today's date in Asia/Kolkata as YYYY-MM-DD
export function istToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

// Day-of-week (0=Sun … 6=Sat) for a plain YYYY-MM-DD date
export function dayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

// Add n days to a YYYY-MM-DD date → YYYY-MM-DD
export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

/* ---------- Recurrence logic ---------- */
// Does this task occur on the given calendar date?
export function occursOn(task: PersonalTask, dateStr: string): boolean {
  if (!task.recurrence) return task.due_date === dateStr;          // one-time
  if (task.recurrence === "daily") return true;
  if (task.recurrence === "weekly")
    return (task.repeat_days ?? []).includes(dayOfWeek(dateStr));
  if (task.recurrence === "monthly") {
    const dom = task.repeat_dom ??
      (task.due_date ? Number(task.due_date.split("-")[2]) : null);
    return dom != null && dom === Number(dateStr.split("-")[2]);
  }
  return false;
}

// Is this task ticked off for the given date?
export function isCheckedOn(task: PersonalTask, dateStr: string): boolean {
  return task.recurrence ? task.last_done_on === dateStr : task.is_done;
}

// A one-time task past its due date and still not done
export function isOverdue(task: PersonalTask, today: string): boolean {
  return !task.recurrence && !task.is_done && !!task.due_date && task.due_date < today;
}

/* ---------- Formatting ---------- */
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
