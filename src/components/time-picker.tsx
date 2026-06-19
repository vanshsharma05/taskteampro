"use client";

import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/personal";

const QUICK = [
  { label: "Morning", value: "08:00" },
  { label: "Noon", value: "12:00" },
  { label: "Evening", value: "18:00" },
  { label: "Night", value: "21:00" },
];

// every half-hour slot, 00:00 … 23:30
const SLOTS: string[] = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

export function TimePicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const normalized = value ? value.slice(0, 5) : null;
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {QUICK.map((q) => (
          <button
            key={q.label}
            type="button"
            onClick={() => onChange(q.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              normalized === q.value
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            {q.label}
          </button>
        ))}
        {normalized && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            No time
          </button>
        )}
      </div>

      <div className="max-h-44 overflow-y-auto rounded-xl border border-border">
        <div className="grid grid-cols-3 gap-1 p-1">
          {SLOTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className={cn(
                "rounded-lg px-2 py-1.5 text-xs transition",
                normalized === s
                  ? "bg-foreground font-semibold text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {formatTime(s)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
