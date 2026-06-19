"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { istToday, addDays } from "@/lib/personal";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function ymd(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function DatePicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const today = istToday();
  const init = (value ?? today).split("-").map(Number);
  const [viewY, setViewY] = useState(init[0]);
  const [viewM, setViewM] = useState(init[1] - 1); // 0-based

  const firstDow = new Date(Date.UTC(viewY, viewM, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(viewY, viewM + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function prevMonth() {
    if (viewM === 0) { setViewM(11); setViewY((y) => y - 1); } else setViewM((m) => m - 1);
  }
  function nextMonth() {
    if (viewM === 11) { setViewM(0); setViewY((y) => y + 1); } else setViewM((m) => m + 1);
  }

  const quick = [
    { label: "Today", value: today },
    { label: "Tomorrow", value: addDays(today, 1) },
    { label: "Next week", value: addDays(today, 7) },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {quick.map((q) => (
          <button
            key={q.label}
            type="button"
            onClick={() => onChange(q.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              value === q.value
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            {q.label}
          </button>
        ))}
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      <div className="mb-2 flex items-center justify-between px-1">
        <button type="button" onClick={prevMonth} className="grid size-7 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground">
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-sm font-semibold">{MONTHS[viewM]} {viewY}</span>
        <button type="button" onClick={nextMonth} className="grid size-7 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground">
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="py-1 text-[11px] font-medium text-muted-foreground">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const ds = ymd(viewY, viewM, d);
          const isToday = ds === today;
          const isSelected = ds === value;
          const isPast = ds < today;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(ds)}
              className={cn(
                "mx-auto grid size-9 place-items-center rounded-full text-sm transition",
                isSelected
                  ? "bg-foreground font-semibold text-background"
                  : isPast
                  ? "text-muted-foreground/40 hover:bg-muted hover:text-foreground"
                  : "text-foreground hover:bg-muted",
                isToday && !isSelected && "font-semibold text-indigo-600 dark:text-indigo-400",
              )}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
