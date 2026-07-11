"use client";

import { createElement, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Clock, Repeat, Flag, Trash2, CalendarDays, Plus, Copy,
  CheckCircle2, Circle, Ban, RotateCcw, AlarmClock,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/date-picker";
import { TimePicker } from "@/components/time-picker";
import {
  DEFAULT_CATEGORIES, categoryIcon, istToday, isCheckedOn, isSnoozed, isSkippedOn, isOverdue, addDays,
  formatTime, formatDateLabel, describeRepeat, formatSnoozeUntil,
  type PersonalTask, type SubTask,
} from "@/lib/personal";
import { realisticMinutes, formatMin, type BiasReport } from "@/lib/time-honesty";

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
  task, userId, bias, onClose, onUpdated, onDelete, onDuplicated,
}: {
  task: PersonalTask | null;
  userId: string;
  bias: BiasReport;
  onClose: () => void;
  onUpdated: (t: PersonalTask) => void;
  onDelete: (t: PersonalTask) => void;
  onDuplicated: (t: PersonalTask) => void;
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
            <DetailBody key={task.id} task={task} userId={userId} bias={bias} onClose={onClose} onUpdated={onUpdated} onDelete={onDelete} onDuplicated={onDuplicated} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DetailBody({
  task, userId, bias, onClose, onUpdated, onDelete, onDuplicated,
}: {
  task: PersonalTask;
  userId: string;
  bias: BiasReport;
  onClose: () => void;
  onUpdated: (t: PersonalTask) => void;
  onDelete: (t: PersonalTask) => void;
  onDuplicated: (t: PersonalTask) => void;
}) {
  const today = istToday();
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.description ?? "");
  const [subtasks, setSubtasks] = useState<SubTask[]>(task.subtasks ?? []);
  const [newSub, setNewSub] = useState("");
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const subRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

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

  // moving a date LATER counts as a slip; pulling it earlier doesn't
  function reschedule(d: string | null) {
    const pushedLater = !!d && !!(task.due_date ?? today) && d > (task.due_date ?? today);
    patch({
      due_date: d, skipped_on: null,
      ...(pushedLater ? { reschedule_count: (task.reschedule_count ?? 0) + 1 } : {}),
    });
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

  async function duplicate() {
    if (duplicating) return;
    setDuplicating(true);
    const { data } = await createClient().from("tasks").insert({
      user_id: userId,
      title: `${task.title} (copy)`,
      description: task.description,
      category: task.category,
      importance: task.importance,
      status: "pending",
      task_type: "individual",
      due_date: task.due_date,
      due_time: task.due_time,
      recurrence: task.recurrence,
      repeat_days: task.repeat_days,
      repeat_dom: task.repeat_dom,
      repeat_every_min: task.repeat_every_min,
      window_start: task.window_start,
      window_end: task.window_end,
      subtasks: (task.subtasks ?? []).map((s) => ({ ...s, done: false })),
    }).select().single();
    setDuplicating(false);
    if (data) {
      onDuplicated({
        ...task, id: data.id, title: data.title,
        is_done: false, last_done_on: null, completed_at: null,
        snoozed_until: null, skipped_on: null, google_event_id: null,
        subtasks: data.subtasks ?? [],
      });
      onClose();
    }
  }

  const actionBtn = (active: boolean, activeCls: string) =>
    cn("inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition active:scale-[0.97]",
      active ? activeCls : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground");

  return (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0 flex-1">
          <input ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Task title"
            onBlur={() => {
              const v = title.trim();
              if (v && v !== task.title) patch({ title: v });
              else setTitle(task.title);
            }}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            className={cn("w-full bg-transparent font-heading text-lg font-bold leading-snug outline-none",
              "rounded-md transition focus:bg-muted/60 focus:px-2 focus:py-0.5",
              checked && "text-muted-foreground line-through")} />
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

        {/* reschedule — one-off tasks only; repeats follow their own rule */}
        {!task.recurrence && !checked && (
          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Due date</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Today", date: today },
                { label: "Tomorrow", date: addDays(today, 1) },
                { label: "Next week", date: addDays(today, 7) },
              ].map(({ label, date }) => (
                <button key={label} type="button"
                  onClick={() => { setShowDatePicker(false); reschedule(date); }}
                  className={cn("rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    task.due_date === date ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground")}>
                  {label}
                </button>
              ))}
              <button type="button" onClick={() => setShowDatePicker((s) => !s)}
                className={cn("rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  showDatePicker ? "border-foreground text-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground")}>
                {task.due_date && ![today, addDays(today, 1), addDays(today, 7)].includes(task.due_date)
                  ? formatDateLabel(task.due_date, today) : "Pick a date…"}
              </button>
            </div>
            {showDatePicker && (
              <div className="mt-2 rounded-2xl border border-border">
                <DatePicker value={task.due_date}
                  onChange={(d) => { setShowDatePicker(false); reschedule(d); }} />
              </div>
            )}
          </div>
        )}

        {/* time — not for interval reminders, which use a window instead */}
        {task.recurrence !== "interval" && !checked && (
          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Time</p>
            <div className="rounded-2xl border border-border">
              <button type="button" onClick={() => setShowTimePicker((s) => !s)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground"><Clock className="size-4" /> Remind at</span>
                <span className="font-medium">{task.due_time ? formatTime(task.due_time) : "No time"}</span>
              </button>
              {showTimePicker && (
                <div className="px-2 pb-2">
                  <TimePicker value={task.due_time} onChange={(t) => patch({ due_time: t })} />
                  {task.due_time && (
                    <button type="button" onClick={() => { patch({ due_time: null }); setShowTimePicker(false); }}
                      className="mt-1.5 w-full rounded-lg px-2 py-1.5 text-center text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
                      Remove time
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* procrastination diagnosis — shows only when a task keeps slipping */}
        {!checked && !task.recurrence && (task.reschedule_count >= 3 || (isOverdue(task, today) && task.reschedule_count >= 1)) && (
          <div className="mt-6 rounded-2xl border border-amber-300/60 bg-amber-50 p-3.5 dark:border-amber-500/30 dark:bg-amber-500/10">
            <p className="text-sm font-medium">
              This one keeps slipping{task.reschedule_count > 0 && <> — pushed {task.reschedule_count}×</>}. What&rsquo;s really going on?
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <button type="button" onClick={() => { titleRef.current?.focus(); titleRef.current?.select(); }}
                className="rounded-xl border border-border bg-background px-2.5 py-2 text-left text-xs font-medium transition hover:border-foreground/30">
                Too vague<span className="block text-[10px] font-normal text-muted-foreground">Rewrite it as one concrete action</span>
              </button>
              <button type="button" onClick={() => subRef.current?.focus()}
                className="rounded-xl border border-border bg-background px-2.5 py-2 text-left text-xs font-medium transition hover:border-foreground/30">
                Too big<span className="block text-[10px] font-normal text-muted-foreground">Break off the first small piece</span>
              </button>
              <button type="button" onClick={() => {
                patch({ skipped_on: today });
                setNotes((n) => (n.startsWith("Waiting on") ? n : `Waiting on: \n${n}`));
                requestAnimationFrame(() => notesRef.current?.focus());
              }}
                className="rounded-xl border border-border bg-background px-2.5 py-2 text-left text-xs font-medium transition hover:border-foreground/30">
                Waiting on someone<span className="block text-[10px] font-normal text-muted-foreground">Note who — it stops nagging you</span>
              </button>
              <button type="button" onClick={() => {
                const t = task.title.startsWith("Start: ") ? task.title : `Start: ${task.title}`;
                setTitle(t);
                patch({ title: t, estimate_min: 10, due_date: today });
              }}
                className="rounded-xl border border-border bg-background px-2.5 py-2 text-left text-xs font-medium transition hover:border-foreground/30">
                I dread it<span className="block text-[10px] font-normal text-muted-foreground">Shrink to a 10-minute version, today</span>
              </button>
            </div>
          </div>
        )}

        {/* effort estimate + your learned bias */}
        {!task.recurrence && !checked && (
          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">How long will it take?</p>
            <div className="flex flex-wrap gap-1.5">
              {[{ v: 5, l: "5m" }, { v: 15, l: "15m" }, { v: 30, l: "30m" }, { v: 60, l: "1h" }, { v: 120, l: "2h" }].map(({ v, l }) => (
                <button key={v} type="button" onClick={() => patch({ estimate_min: task.estimate_min === v ? null : v })}
                  className={cn("rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    task.estimate_min === v ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground")}>
                  {l}
                </button>
              ))}
            </div>
            {task.estimate_min != null && (bias.overall !== null || bias.byCategory.length > 0) && (() => {
              const real = realisticMinutes(task, bias);
              return Math.abs(real - task.estimate_min) >= 5 ? (
                <p className="mt-2 text-[12px] text-muted-foreground">
                  Based on your track record, this realistically takes <span className="font-semibold text-foreground">~{formatMin(real)}</span>.
                </p>
              ) : null;
            })()}
          </div>
        )}

        {/* category */}
        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</p>
          <div className="flex flex-wrap gap-1.5">
            {DEFAULT_CATEGORIES.map(({ name, Icon }) => {
              const active = (task.category ?? "").toLowerCase() === name.toLowerCase();
              return (
                <button key={name} type="button" onClick={() => patch({ category: active ? null : name })}
                  className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    active ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground")}>
                  <Icon className="size-3.5" /> {name}
                </button>
              );
            })}
            {task.category && !DEFAULT_CATEGORIES.some((c) => c.name.toLowerCase() === task.category!.toLowerCase()) && (
              <button type="button" onClick={() => patch({ category: null })}
                className="inline-flex items-center gap-1.5 rounded-full border border-foreground bg-foreground px-3 py-1.5 text-xs font-medium text-background">
                {task.category} <X className="size-3" />
              </button>
            )}
          </div>
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
            <input ref={subRef} value={newSub} onChange={(e) => setNewSub(e.target.value)}
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
          <textarea ref={notesRef} value={notes} onChange={(e) => setNotes(e.target.value)}
            onBlur={() => { if ((task.description ?? "") !== notes) patch({ description: notes.trim() || null }); }}
            placeholder="Add details, links, or anything to remember…" rows={4}
            className="w-full resize-none rounded-xl border border-border bg-transparent px-3 py-2 text-sm outline-none transition focus:border-foreground/30 placeholder:text-muted-foreground/60" />
          <p className="mt-1 text-[11px] text-muted-foreground/70">Saves when you click away.</p>
        </div>
      </div>

      <div className="pb-safe flex items-center justify-between border-t border-border px-5 pt-3">
        <button type="button" onClick={() => { onDelete(task); onClose(); }}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
          <Trash2 className="size-3.5" /> Delete task
        </button>
        <button type="button" onClick={duplicate} disabled={duplicating}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50">
          <Copy className="size-3.5" /> {duplicating ? "Duplicating…" : "Duplicate"}
        </button>
      </div>
    </>
  );
}
