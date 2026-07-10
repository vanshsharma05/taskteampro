"use client";

import { Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime, type PersonalTask } from "@/lib/personal";

/**
 * Quiet day summary: progress, what's next, what's overdue.
 * Dense on information, light on decoration — it's read every day.
 */
export function DailyDigest({ pending, doneCount, overdueCount }: {
  pending: PersonalTask[]; doneCount: number; overdueCount: number;
}) {
  const total = pending.length + doneCount;
  if (total === 0 && overdueCount === 0) return null;

  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const allDone = pending.length === 0 && overdueCount === 0;

  // next task = earliest timed one; fall back to the first timeless one
  const next = [...pending]
    .sort((a, b) => (a.due_time ?? "99") < (b.due_time ?? "99") ? -1 : 1)[0];

  const dateLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "short", timeZone: "Asia/Kolkata",
  });

  return (
    <div className="mb-5 rounded-2xl border border-border bg-card px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{dateLabel}</p>
        <p className="text-sm font-semibold tabular-nums">
          {doneCount} of {total} done
        </p>
      </div>

      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-500",
            allDone ? "bg-emerald-500" : "bg-foreground")}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
        {allDone ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
            <Check className="size-3.5" strokeWidth={3} /> All done for today
          </span>
        ) : next ? (
          <span className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground">
            <Clock className="size-3.5 shrink-0" />
            <span className="truncate">
              Next: <span className="font-medium text-foreground">{next.title}</span>
              {next.due_time && <> · {formatTime(next.due_time)}</>}
            </span>
          </span>
        ) : null}
        {overdueCount > 0 && (
          <span className="font-semibold text-red-600 dark:text-red-400">
            {overdueCount} overdue
          </span>
        )}
      </div>
    </div>
  );
}
