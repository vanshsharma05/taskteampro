// Lightweight scoring + date helpers. All dates evaluated in India Standard Time
// so results match on server and client and are correct for the pilot.

export type Importance = "normal" | "high";

export type ScoringTask = {
  id: string;
  user_id: string;
  title: string;
  due_date: string;          // "YYYY-MM-DD"
  due_time: string;          // "HH:MM:SS"
  importance: Importance;
  is_done: boolean;
  task_type: string;         // "individual" | "special" | "cyclic"
  recurrence: string | null; // "daily" | "weekly" | "monthly" | "yearly" | null
  completed_at: string | null;
  blocked?: boolean;
  blocked_by?: string | null;
  block_reason?: string | null;
};

export type TaskStatus = "pending" | "ontime" | "late" | "overdue" | "upcoming";

const TZ = "Asia/Kolkata";
const TZ_OFFSET = "+05:30";

const dateFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const weekdayFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" });
const dueFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const timeFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
const stampFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function istDateStr(d: Date): string {
  return dateFmt.format(d); // "YYYY-MM-DD"
}
export function isRepeating(t: ScoringTask): boolean {
  return t.task_type === "cyclic";
}
export function isBlocked(t: ScoringTask): boolean {
  return !!t.blocked;
}
export function isReady(t: ScoringTask): boolean {
  return !t.blocked && !!t.blocked_by;
}
function deadlineInstant(t: ScoringTask): Date {
  return new Date(`${t.due_date}T${t.due_time}${TZ_OFFSET}`);
}
function todayDeadlineInstant(t: ScoringTask, now: Date): Date {
  return new Date(`${istDateStr(now)}T${t.due_time}${TZ_OFFSET}`);
}

export function isDueToday(t: ScoringTask, now: Date): boolean {
  const today = istDateStr(now);
  if (!isRepeating(t)) return t.due_date === today;
  switch (t.recurrence) {
    case "daily":
      return true;
    case "weekly":
      return weekdayFmt.format(new Date(`${t.due_date}T12:00:00${TZ_OFFSET}`)) === weekdayFmt.format(now);
    case "monthly":
      return t.due_date.slice(8, 10) === today.slice(8, 10);
    case "yearly":
      return t.due_date.slice(5, 10) === today.slice(5, 10);
    default:
      return true;
  }
}

export function doneToday(t: ScoringTask, now: Date): boolean {
  return !!t.completed_at && istDateStr(new Date(t.completed_at)) === istDateStr(now);
}

export function isDoneNow(t: ScoringTask, now: Date): boolean {
  return isRepeating(t) ? doneToday(t, now) : t.is_done;
}

export function showsToday(t: ScoringTask, now: Date): boolean {
  return isRepeating(t) ? isDueToday(t, now) : true;
}

export function taskStatus(t: ScoringTask, now: Date): TaskStatus {
  if (isRepeating(t)) {
    if (!isDueToday(t, now)) return "upcoming";
    const due = todayDeadlineInstant(t, now);
    if (doneToday(t, now)) return new Date(t.completed_at!) <= due ? "ontime" : "late";
    return now > due ? "overdue" : "pending";
  }
  const due = deadlineInstant(t);
  if (t.is_done) {
    if (!t.completed_at) return "ontime";
    return new Date(t.completed_at) <= due ? "ontime" : "late";
  }
  return now > due ? "overdue" : "pending";
}

export type EmployeeScore = {
  ontime: number; late: number; overdue: number; pending: number;
  dueTodayTotal: number; doneToday: number; score: number | null;
};

export function scoreTasks(tasks: ScoringTask[], now: Date): EmployeeScore {
  let ontime = 0, late = 0, overdue = 0, pending = 0, dueTodayTotal = 0, doneTodayCount = 0;
  for (const t of tasks) {
    const st = taskStatus(t, now);
    if (st === "ontime") ontime++;
    else if (st === "late") late++;
    else if (st === "overdue") overdue++;
    else if (st === "pending") pending++;
    if (isDueToday(t, now)) {
      dueTodayTotal++;
      if (isDoneNow(t, now)) doneTodayCount++;
    }
  }
  const resolved = ontime + late + overdue;
  const score = resolved === 0 ? null : Math.round(((ontime + late * 0.5) / resolved) * 100);
  return { ontime, late, overdue, pending, dueTodayTotal, doneToday: doneTodayCount, score };
}

export function formatDue(t: ScoringTask): string { return dueFmt.format(deadlineInstant(t)); }
export function formatTime(due_time: string): string { return timeFmt.format(new Date(`2000-01-01T${due_time}${TZ_OFFSET}`)); }
export function formatTimestamp(iso: string): string { return stampFmt.format(new Date(iso)); }
