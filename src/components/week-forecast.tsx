"use client";

import { cn } from "@/lib/utils";
import { formatDateLabel } from "@/lib/personal";
import { formatMin, type DayLoad } from "@/lib/time-honesty";

const LEVEL_BAR: Record<DayLoad["level"], string> = {
  clear: "bg-emerald-500/80",
  busy: "bg-amber-500/80",
  storm: "bg-rose-500/90",
};

/**
 * Week Weather Forecast: predicted load per day from your tasks (at their
 * realistic durations) plus Google Calendar events. Warns days ahead.
 */
export function WeekForecast({ days, today }: { days: DayLoad[]; today: string }) {
  const max = Math.max(...days.map((d) => d.taskMin + d.eventMin), 60);
  const storms = days.filter((d) => d.level === "storm");

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">Week forecast</h2>
        <span className="text-[11px] text-muted-foreground">tasks + calendar</span>
      </div>

      <div className="mt-3 flex items-end gap-1.5" style={{ height: 72 }}>
        {days.map((d) => {
          const total = d.taskMin + d.eventMin;
          const h = Math.max(6, Math.round((total / max) * 64));
          const label = formatDateLabel(d.date, today);
          return (
            <div key={d.date} className="flex flex-1 flex-col items-center justify-end gap-1"
              title={`${label}: ${formatMin(total)} scheduled (${formatMin(d.taskMin)} tasks + ${formatMin(d.eventMin)} events)`}>
              <span className="text-[10px] tabular-nums text-muted-foreground">{total > 0 ? formatMin(total) : ""}</span>
              <div className={cn("w-full rounded-t-md transition-all", LEVEL_BAR[d.level])} style={{ height: h }} />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex gap-1.5">
        {days.map((d) => (
          <span key={d.date} className="flex-1 text-center text-[10px] font-semibold text-muted-foreground">
            {formatDateLabel(d.date, today).slice(0, 3)}
          </span>
        ))}
      </div>

      {storms.length > 0 ? (
        <p className="mt-3 text-[13px] text-rose-600 dark:text-rose-400">
          {storms.map((d) => `${formatDateLabel(d.date, today)} looks overloaded — ${formatMin(d.taskMin + d.eventMin)} scheduled`).join(" · ")}.
          {" "}Move something now, not that morning.
        </p>
      ) : (
        <p className="mt-3 text-[13px] text-muted-foreground">No overload in sight this week.</p>
      )}
    </div>
  );
}
