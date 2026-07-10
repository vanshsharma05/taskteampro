"use client";

import { createElement, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Clock, Repeat, Flag, Trash2, CalendarDays, Plus,
  CheckCircle2, Circle, Ban, RotateCcw, AlarmClock,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import {
  categoryIcon, istToday, isCheckedOn, isSnoozed, isSkippedOn,
  formatTime, formatDateLabel, describeRepeat, formatSnoozeUntil,
  type PersonalTask, type SubTask,
} from "@/lib/personal";

const SNOOZE_OPTIONS = [
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "3 hours", minutes: 180 },
  { label: "Tomorrow 9 AM", minutes: -1 }, // sentinel — computed below
];

function snoozeTarget(minutes: number): string {
  if (minutes > 0) return new Date(Date.now() + minutes * 60_000).toISOString();
  // tomorrow 9:00 IST
  const todayIst = istToday();
  const [y, m, d] = todayIst.split("-").map(Number);
  // 9:00 IST is 3:30 UTC
  const dt = new Date(Date.UTC(y, m - 1, d + 1, 3, 30));
  return dt.toISOString();
}

export function TaskDetailSheet({
  task, onClose, onUpdated, onDelete,
}: {
  task: PersonalTask | null;
  onClose: () => void;
  onUpdated: (t: PersonalTask) => void;
  onDelete: (t: PersonalTask) => void;
}) {
  useEffect(() => {
    if (!task) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [task, onClose]);

  return (
    <AnimatePresence>
      {task && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-background shadow-2xl sm:max-h-[88vh] sm:max-w-md sm:rounded-3xl"
            initial={{ y: 40, opacity: 0.6 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}>
            {/* keyed on task id so switching tasks resets local state */}
            <DetailBody key={task.id} task={task} onClose={onClose} onUpdated={onUpdated} onDelete={onDelete} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DetailBody({
  task, onClose, onUpdated, onDelete,
}: {
  task: PersonalTask;
  onClose: () => void;
  onUpdated: (t: PersonalTask) => void;
  onDelete: (t: PersonalTask) => void;
}) {
  const today = istToday();
  const [notes, setNotes] = useState(task.description ?? "");
  const [subtasks, setSubtasks] = useState<SubTask[]>(task.subtasks ?? []);
  const [newSub, setNewSub] = useState("");
  const [snoozeOpen, setSnoozeOpen] = useState(false);

  const checked = isCheckedOn(task, today);
  const snoozed = isSnoozed(task);
  const skipped = isSkippedOn(task, today);
  const repeatLabel = describeRepeat(task);

  async function patch(updates: Partial<PersonalTask>) {
    const next = { ...task, ...updates };
    onUpdated(next);
    await createClient().from("tasks").update(updates).eq("id", task.id);
  }

  function toggleDone() {
    if (task.recurrence) {
      patch({ last_done_on: checked ? null : today, snoozed_until: null, skipped_on: null });
    } else {
      const done = !checked;
      patch({ is_done: done, completed_at: done ? new Date().toISOString() : null, snoozed_until: null, skipped_on: null });
    }
  }

  function snooze(minutes: number) {
    setSnoozeOpen(false);
    patch({ snoozed_until: snoozeTarget(minutes), skipped_on: null });
  }

  function toggleSkip() {
    patch({ skipped_on: skipped ? null : today, snoozed_until: null });
  }

  function saveSubtasks(next: SubTask[]) {
    setSubtasks(next);
    patch({ subtasks: next });
  }

  function addSubtask() {
    const text = newSub.trim();
    if (!text) return;
    setNewSub("");
    saveSubtasks([...subtasks, { id: crypto.randomUUID(), text, done: false }]);
  }

  const actionBtn = (active: boolean, activeCls: string) =>
    cn("inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition active:scale-[0.97]",
      active ? activeCls : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground");

  return (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 className={cn("font-heading text-lg font-bold leading-snug", checked && "text-muted-foreground line-through")}>{task.title}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[12px] text-muted-foreground">
            {task.due_date && !task.recurrence && (
              <span className="inline-flex items-center gap-1"><CalendarDays className="size-3" />{formatDateLabel(task.due_date, today)}</span>
            )}
            {task.due_time && <span className="inline-flex items-center gap-1"><Clock className="size-3" />{formatTime(task.due_time)}</span>}
            {task.category && <span className="inline-flex items-center gap-1">{createElement(categoryIcon(task.category), { className: "size-3" })}{task.category}</span>}
            {repeatLabel && <span className="inline-flex items-center gap-1"><Repeat className="size-3" />{repeatLabel}</span>}
          </div>
        </div>
        <button type="button" onClick={onClose} className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* status banners */}
        {snoozed && task.snoozed_until && (
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
            <AlarmClock className="size-3.5" /> Snoozed until {formatSnoozeUntil(task.snoozed_until)}
          </p>
        )}
        {skipped && (
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            <Ban className="size-3.5" /> {task.recurrence ? "Skipped for today" : "Skipped"}
          </p>
        )}

        {/* actions */}
        <div className="relative flex flex-wrap gap-1.5">
          <button type="button" onClick={toggleDone}
            className={actionBtn(checked, "border-emerald-500 bg-emerald-500 text-white")}>
            {checked ? <RotateCcw className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
            {checked ? "Undo" : "Done"}
          </button>
          {!checked && (
            <>
              <div className="relative">
                <button type="button" onClick={() => setSnoozeOpen((s) => !s)}
                  className={actionBtn(snoozed || snoozeOpen, "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400")}>
                  <AlarmClock className="size-3.5" /> Snooze
                </button>
                <AnimatePresence>
                  {snoozeOpen && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                      className="absolute left-0 top-full z-10 mt-1 w-40 rounded-xl border border-border bg-popover p-1 shadow-lg">
                      {SNOOZE_OPTIONS.map((o) => (
                        <button key={o.label} type="button" onClick={() => snooze(o.minutes)}
                          className="w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-foreground transition hover:bg-muted">
                          {o.label}
                        </button>
                      ))}
                      {snoozed && (
                        <button type="button" onClick={() => { setSnoozeOpen(false); patch({ snoozed_until: null }); }}
                          className="w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-red-600 transition hover:bg-muted dark:text-red-400">
                          Unsnooze
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button type="button" onClick={toggleSkip}
                className={actionBtn(skipped, "border-foreground/40 bg-muted text-foreground")}>
                <Ban className="size-3.5" /> {skipped ? "Unskip" : "Skip"}
              </button>
            </>
          )}
          <button type="button"
            onClick={() => patch({ importance: task.importance === "high" ? "normal" : "high" })}
            className={actionBtn(task.importance === "high", "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400")}>
            <Flag className="size-3.5" /> {task.importance === "high" ? "High priority" : "Priority"}
          </button>
        </div>

        {/* subtasks */}
        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Subtasks{subtasks.length > 0 && ` · ${subtasks.filter((s) => s.done).length}/${subtasks.length}`}
          </p>
          {subtasks.length > 0 && (
            <div className="mb-2 space-y-1">
              {subtasks.map((sub) => (
                <div key={sub.id} className="group flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2">
                  <button type="button" onClick={() => saveSubtasks(subtasks.map((s) => (s.id === sub.id ? { ...s, done: !s.done } : s)))}
                    className="shrink-0 text-muted-foreground transition hover:text-emerald-600">
                    {sub.done ? <CheckCircle2 className="size-4 text-emerald-500" /> : <Circle className="size-4" />}
                  </button>
                  <span className={cn("min-w-0 flex-1 truncate text-sm", sub.done && "text-muted-foreground line-through")}>{sub.text}</span>
                  <button type="button" onClick={() => saveSubtasks(subtasks.filter((s) => s.id !== sub.id))}
                    aria-label="Delete subtask"
                    className="shrink-0 rounded-md p-0.5 text-muted-foreground/40 transition hover:text-red-600">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-1.5">
            <input value={newSub} onChange={(e) => setNewSub(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addSubtask(); }}
              placeholder="Break it down…"
              className="h-9 min-w-0 flex-1 rounded-[8px] border border-input bg-transparent px-3 text-sm outline-none transition focus:border-foreground/30 placeholder:text-muted-foreground/60" />
            <button type="button" onClick={addSubtask} disabled={!newSub.trim()}
              className="grid size-9 shrink-0 place-items-center rounded-[8px] bg-foreground text-background transition hover:bg-foreground/90 disabled:opacity-40">
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        {/* notes */}
        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</p>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            onBlur={() => { if ((task.description ?? "") !== notes) patch({ description: notes.trim() || null }); }}
            placeholder="Add details, links, or anything to remember…" rows={4}
            className="w-full resize-none rounded-xl border border-border bg-transparent px-3 py-2 text-sm outline-none transition focus:border-foreground/30 placeholder:text-muted-foreground/60" />
          <p className="mt-1 text-[11px] text-muted-foreground/70">Saves when you click away.</p>
        </div>
      </div>

      <div className="border-t border-border px-5 py-3">
        <button type="button" onClick={() => { onDelete(task); onClose(); }}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
          <Trash2 className="size-3.5" /> Delete task
        </button>
      </div>
    </>
  );
}
