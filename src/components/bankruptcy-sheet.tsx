"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sun, Archive, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { istToday, type PersonalTask } from "@/lib/personal";

export type BankruptcyDecision = "today" | "someday" | "delete";

/**
 * Task Bankruptcy Ritual: guided triage of stale tasks. Every task gets one
 * of three fates — do it today, park it as Someday, or let it go. Deleting
 * here is framed as relief, not failure.
 */
export function BankruptcySheet({ open, tasks, onClose, onApply }: {
  open: boolean;
  tasks: PersonalTask[];
  onClose: () => void;
  onApply: (decisions: Map<string, BankruptcyDecision>) => void;
}) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-background shadow-2xl sm:max-h-[88vh] sm:max-w-lg sm:rounded-3xl"
            initial={{ y: 40, opacity: 0.6 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}>
            {/* fresh mount per open = decisions reset for free */}
            <BankruptcyBody tasks={tasks} onClose={onClose} onApply={onApply} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BankruptcyBody({ tasks, onClose, onApply }: {
  tasks: PersonalTask[];
  onClose: () => void;
  onApply: (decisions: Map<string, BankruptcyDecision>) => void;
}) {
  const [decisions, setDecisions] = useState<Map<string, BankruptcyDecision>>(new Map());
  const today = istToday();

  function decide(id: string, d: BankruptcyDecision) {
    setDecisions((prev) => {
      const next = new Map(prev);
      if (next.get(id) === d) next.delete(id); else next.set(id, d);
      return next;
    });
  }

  const counts = { today: 0, someday: 0, delete: 0 };
  for (const d of decisions.values()) counts[d]++;
  const undecided = tasks.length - decisions.size;

  const daysOld = (t: PersonalTask) =>
    t.due_date ? Math.max(0, Math.round((Date.parse(today) - Date.parse(t.due_date)) / 86400_000)) : 0;

  return (
    <>
            <div className="border-b border-border px-5 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-heading text-lg font-bold">Backlog cleanup</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    These {tasks.length} tasks keep slipping. Give each one an honest fate — letting go counts as progress.
                  </p>
                </div>
                <button type="button" onClick={onClose} className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground">
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
              {tasks.map((t) => {
                const d = decisions.get(t.id);
                const age = daysOld(t);
                return (
                  <div key={t.id} className={cn("rounded-2xl border p-3 transition",
                    d === "delete" ? "border-rose-200 bg-rose-50/50 dark:border-rose-500/30 dark:bg-rose-500/5"
                      : d ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-500/30 dark:bg-emerald-500/5"
                      : "border-border bg-card")}>
                    <p className={cn("text-sm font-medium", d === "delete" && "line-through text-muted-foreground")}>{t.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {t.reschedule_count > 0 && <>pushed {t.reschedule_count}× · </>}
                      {age > 0 ? `${age} days overdue` : "no date"}
                    </p>
                    <div className="mt-2 flex gap-1.5">
                      {([
                        { d: "today" as const, icon: Sun, label: "Do today" },
                        { d: "someday" as const, icon: Archive, label: "Someday" },
                        { d: "delete" as const, icon: Trash2, label: "Let it go" },
                      ]).map(({ d: dd, icon: Icon, label }) => (
                        <button key={dd} type="button" onClick={() => decide(t.id, dd)}
                          className={cn("inline-flex flex-1 items-center justify-center gap-1 rounded-full border px-2 py-1.5 text-[11px] font-semibold transition",
                            d === dd
                              ? dd === "delete" ? "border-rose-400 bg-rose-500 text-white" : "border-foreground bg-foreground text-background"
                              : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground")}>
                          <Icon className="size-3" /> {label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pb-safe border-t border-border px-5 pt-3">
              <button type="button" disabled={decisions.size === 0}
                onClick={() => { onApply(decisions); onClose(); }}
                className="w-full rounded-full bg-foreground py-2.5 text-sm font-semibold text-background transition hover:bg-foreground/90 disabled:opacity-40">
                Apply
                {counts.today > 0 && ` · ${counts.today} today`}
                {counts.someday > 0 && ` · ${counts.someday} someday`}
                {counts.delete > 0 && ` · ${counts.delete} released`}
              </button>
              {undecided > 0 && decisions.size > 0 && (
                <p className="mt-1.5 pb-2 text-center text-[11px] text-muted-foreground">{undecided} undecided — they stay as they are.</p>
              )}
            </div>
    </>
  );
}
