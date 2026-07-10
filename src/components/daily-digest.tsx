"use client";

import { motion } from "framer-motion";
import { Sparkles, CalendarDays, Clock } from "lucide-react";
import { formatTime, type PersonalTask } from "@/lib/personal";

/** Compact "how's my day looking" banner, ported from taskorganizer's DailyDigest. */
export function DailyDigest({ pending, doneCount, overdueCount }: {
  pending: PersonalTask[]; doneCount: number; overdueCount: number;
}) {
  if (pending.length + doneCount + overdueCount === 0) return null;

  const sorted = [...pending].sort((a, b) => {
    if (!a.due_time && !b.due_time) return 0;
    if (!a.due_time) return 1;
    if (!b.due_time) return -1;
    return a.due_time < b.due_time ? -1 : 1;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className="relative mb-5 overflow-hidden rounded-3xl border border-indigo-800/50 bg-gradient-to-br from-indigo-950 to-indigo-900 p-5 text-white shadow-md sm:p-6">
      <div className="pointer-events-none absolute right-0 top-0 p-6 opacity-10">
        <Sparkles className="size-32" />
      </div>

      <div className="relative z-10">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-white/10 p-2 backdrop-blur-sm"><CalendarDays className="size-5 text-indigo-100" /></div>
          <div>
            <h2 className="flex items-center gap-2 font-heading text-lg font-bold tracking-tight">
              Daily Digest
              <span className="rounded-full bg-indigo-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-100">Today</span>
            </h2>
            <p className="text-sm font-medium text-indigo-200">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric", timeZone: "Asia/Kolkata" })}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="min-w-0 flex-1">
            {pending.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-indigo-100">
                  You have <strong className="text-base text-white">{pending.length}</strong> task{pending.length !== 1 ? "s" : ""} left today
                  {overdueCount > 0 && <> and <strong className="text-base text-rose-300">{overdueCount}</strong> overdue</>}.
                </p>
                <div className="flex flex-wrap gap-2">
                  {sorted.slice(0, 3).map((t) => (
                    <div key={t.id} className="flex max-w-[220px] items-center gap-1.5 truncate rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-xs">
                      <Clock className="size-3.5 shrink-0 text-indigo-300" />
                      <span className="truncate">{t.title}</span>
                      {t.due_time && <span className="shrink-0 text-indigo-300">{formatTime(t.due_time)}</span>}
                    </div>
                  ))}
                  {sorted.length > 3 && (
                    <div className="flex items-center rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs">
                      +{sorted.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex w-max items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-900/30 px-4 py-3 text-emerald-300">
                <Sparkles className="size-4" />
                <span className="text-sm font-semibold">All caught up for today!</span>
              </div>
            )}
          </div>

          <div className="flex w-full items-center gap-2 rounded-xl border border-white/5 bg-black/20 p-3 sm:w-auto sm:p-4">
            <div className="flex-1 px-3 text-center sm:flex-none sm:px-4">
              <div className="text-2xl font-black">{doneCount}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Done</div>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="flex-1 px-3 text-center sm:flex-none sm:px-4">
              <div className="text-2xl font-black">{pending.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Left</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
