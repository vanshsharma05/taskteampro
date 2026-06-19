"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  CalendarClock,
  AlertTriangle,
  Flame,
  CheckCircle2,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type BriefTask = {
  id: string;
  title: string;
  due_date: string | null;
  due_time: string | null;
  importance: "normal" | "high";
  status: string;
  completed_at: string | null;
};

const istToday = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

const istDateOf = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(iso));

export function MorningBrief({ tasks }: { tasks: BriefTask[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const today = istToday();

  const brief = useMemo(() => {
    const open = tasks.filter((t) => t.status !== "done");
    const dueToday = open.filter((t) => t.due_date === today);
    const slipped = open.filter((t) => t.due_date && t.due_date < today);
    const high = dueToday.filter((t) => t.importance === "high");
    const doneToday = tasks.filter(
      (t) =>
        t.status === "done" &&
        t.completed_at &&
        istDateOf(t.completed_at) === today
    );
    const rank = (t: BriefTask) =>
      (t.due_date && t.due_date < today ? 0 : 1) * 10 +
      (t.importance === "high" ? 0 : 1);
    const focus = [...slipped, ...dueToday]
      .filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i)
      .sort((a, b) => rank(a) - rank(b))
      .slice(0, 3);
    return { dueToday, slipped, high, doneToday, focus };
  }, [tasks, today]);

  const prettyDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date(`${today}T12:00:00+05:30`));

  const allClear = brief.dueToday.length === 0 && brief.slipped.length === 0;

  const summary = allClear
    ? brief.doneToday.length > 0
      ? `Nothing left for today — ${brief.doneToday.length} already done. Nice and clear.`
      : "Nothing due today — you're all caught up."
    : [
        brief.dueToday.length > 0 ? `${brief.dueToday.length} due today` : null,
        brief.slipped.length > 0 ? `${brief.slipped.length} slipped` : null,
        brief.high.length > 0 ? `${brief.high.length} high-priority` : null,
        brief.doneToday.length > 0 ? `${brief.doneToday.length} done so far` : null,
      ]
        .filter(Boolean)
        .join(" · ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className="mx-5 mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm"
    >
      <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
            <Sun className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-bold tracking-tight">
                Morning Brief
              </h3>
              <span className="text-[12px] text-muted-foreground">· {prettyDate}</span>
            </div>
            <p className="mt-0.5 text-[13px] text-muted-foreground">{summary}</p>
          </div>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="rounded-md p-1 text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-foreground active:scale-90"
            aria-label={collapsed ? "Expand brief" : "Collapse brief"}
          >
            <ChevronDown
              className={cn("size-4 transition-transform", collapsed && "-rotate-90")}
            />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mt-3 flex flex-wrap gap-2">
                <Stat icon={CalendarClock} tone="blue" label="Due today" value={brief.dueToday.length} />
                <Stat icon={AlertTriangle} tone="red" label="Slipped" value={brief.slipped.length} />
                <Stat icon={Flame} tone="amber" label="High" value={brief.high.length} />
                <Stat icon={CheckCircle2} tone="emerald" label="Done today" value={brief.doneToday.length} />
              </div>

              {brief.focus.length > 0 ? (
                <div className="mt-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Focus next
                  </p>
                  <div className="space-y-1.5">
                    {brief.focus.map((t) => {
                      const isSlipped = !!t.due_date && t.due_date < today;
                      return (
                        <div
                          key={t.id}
                          className="flex items-center gap-2.5 rounded-lg border border-border bg-background/60 px-3 py-2"
                        >
                          <span
                            className={cn(
                              "size-2 shrink-0 rounded-full",
                              t.importance === "high" ? "bg-red-500" : "bg-indigo-400"
                            )}
                          />
                          <span className="flex-1 truncate text-[13px] font-medium">
                            {t.title}
                          </span>
                          {isSlipped ? (
                            <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600 dark:bg-red-500/15 dark:text-red-400">
                              Slipped
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                              Today
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/50 px-3 py-3 text-[13px] font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                  You're clear for today. Good time to plan ahead or knock out something early.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function Stat({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: LucideIcon;
  tone: "blue" | "red" | "amber" | "emerald";
  label: string;
  value: number;
}) {
  const tones: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    red: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  };
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold",
        tones[tone]
      )}
    >
      <Icon className="size-3.5" />
      <span className="tabular-nums">{value}</span>
      <span className="font-medium opacity-80">{label}</span>
    </div>
  );
}
