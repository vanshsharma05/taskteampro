"use client";

import { cn } from "@/lib/utils";

const QUICK = [
  { label: "Morning", value: "08:00" },
  { label: "Noon", value: "12:00" },
  { label: "Evening", value: "18:00" },
  { label: "Night", value: "21:00" },
];

function parse(value: string | null) {
  if (!value) return { h12: 9, min: 0, pm: false };
  const [hStr, mStr] = value.split(":");
  let h = Number(hStr);
  const pm = h >= 12;
  h = h % 12 || 12;
  return { h12: h, min: Number(mStr ?? 0), pm };
}

function compose(h12: number, min: number, pm: boolean) {
  let h = h12 % 12;
  if (pm) h += 12;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function nice(v: string) {
  const [h, m] = v.split(":");
  let hh = Number(h);
  const ap = hh >= 12 ? "PM" : "AM";
  hh = hh % 12 || 12;
  return `${hh}:${m} ${ap}`;
}

const selectCls =
  "h-10 rounded-[10px] border border-input bg-transparent px-2 text-center text-sm font-medium outline-none transition focus:border-foreground/30";

export function TimePicker({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const { h12, min, pm } = parse(value);
  const set = (next: { h12?: number; min?: number; pm?: boolean }) =>
    onChange(compose(next.h12 ?? h12, next.min ?? min, next.pm ?? pm));

  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {QUICK.map((q) => (
          <button key={q.label} type="button" onClick={() => onChange(q.value)}
            className={cn("rounded-full border px-3 py-1 text-xs font-medium transition",
              value === q.value
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground")}>
            {q.label}
          </button>
        ))}
        {value && (
          <button type="button" onClick={() => onChange(null)}
            className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition hover:text-foreground">
            No time
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <select aria-label="Hour" value={h12} onChange={(e) => set({ h12: Number(e.target.value) })} className={cn(selectCls, "flex-1")}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <span className="text-lg font-semibold text-muted-foreground">:</span>
        <select aria-label="Minute" value={min} onChange={(e) => set({ min: Number(e.target.value) })} className={cn(selectCls, "flex-1")}>
          {Array.from({ length: 60 }, (_, i) => i).map((n) => <option key={n} value={n}>{String(n).padStart(2, "0")}</option>)}
        </select>
        <div className="flex overflow-hidden rounded-[10px] border border-input">
          {(["AM", "PM"] as const).map((label) => {
            const active = (label === "PM") === pm;
            return (
              <button key={label} type="button" onClick={() => set({ pm: label === "PM" })}
                className={cn("px-3 py-2 text-sm font-semibold transition",
                  active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-2 text-center text-xs text-muted-foreground">
        {value ? `Set to ${nice(value)}` : "Pick an exact time — down to the minute"}
      </p>
    </div>
  );
}
