"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CalendarDays, Clock, Flag, Plus, Tag } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import {
  DEFAULT_CATEGORIES, istToday, dayOfWeek, formatTime, formatDateLabel,
  type PersonalTask,
} from "@/lib/personal";
import { DatePicker } from "@/components/date-picker";
import { TimePicker } from "@/components/time-picker";
import { hasGoogleToken, createGoogleEvent } from "@/lib/google-calendar";

type Repeat = "none" | "daily" | "weekly" | "monthly" | "interval";
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

const selectCls =
  "h-9 rounded-[8px] border border-input bg-transparent px-2 text-sm outline-none transition focus:border-foreground/30";

const EVERY = [
  { v: 15, label: "15 min" }, { v: 30, label: "30 min" }, { v: 45, label: "45 min" },
  { v: 60, label: "1 hour" }, { v: 120, label: "2 hours" }, { v: 180, label: "3 hours" }, { v: 240, label: "4 hours" },
];
const SLOTS = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`);

export function AddTaskSheet({
  open, onClose, userId, onCreated, knownCategories = [], initialDate = null,
}: {
  open: boolean; onClose: () => void; userId: string;
  onCreated: (task: PersonalTask) => void; knownCategories?: string[];
  initialDate?: string | null;
}) {
  // body scroll lock + escape to close
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          <motion.div
            className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-background shadow-2xl sm:max-h-[88vh] sm:max-w-md sm:rounded-3xl"
            initial={{ y: 40, opacity: 0.6 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}>
            {/* mounting fresh on every open gives the form a clean slate without a reset effect */}
            <AddTaskForm onClose={onClose} userId={userId} onCreated={onCreated} knownCategories={knownCategories} initialDate={initialDate} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AddTaskForm({
  onClose, userId, onCreated, knownCategories, initialDate,
}: {
  onClose: () => void; userId: string; onCreated: (task: PersonalTask) => void; knownCategories: string[];
  initialDate: string | null;
}) {
  const today = istToday();

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);

  const [category, setCategory] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const [dueDate, setDueDate] = useState<string | null>(initialDate ?? today);
  const [dueTime, setDueTime] = useState<string | null>(null);
  const [showCal, setShowCal] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const [repeat, setRepeat] = useState<Repeat>("none");
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [repeatDom, setRepeatDom] = useState<number | null>(null);
  const [everyMin, setEveryMin] = useState(30);
  const [winStart, setWinStart] = useState("09:00");
  const [winEnd, setWinEnd] = useState("18:00");

  const [importance, setImportance] = useState<"normal" | "high">("normal");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // push one-off dated tasks to Google Calendar when connected
  const [gcalConnected] = useState(() => hasGoogleToken());
  const [addToGcal, setAddToGcal] = useState(true);
  const canPushToGcal = gcalConnected && repeat === "none" && !!dueDate;

  const finalCategory = (customMode ? customValue.trim() : category) || null;
  const weeklyInvalid = repeat === "weekly" && repeatDays.length === 0;
  const intervalInvalid = repeat === "interval" && winStart >= winEnd;
  const canSave = title.trim().length > 0 && !weeklyInvalid && !intervalInvalid && !saving;

  function toggleDay(d: number) {
    setRepeatDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)));
  }

  function pickRepeat(r: Repeat) {
    setRepeat(r);
    if (r === "weekly" && repeatDays.length === 0) setRepeatDays([dayOfWeek(today)]);
    if (r === "monthly" && repeatDom == null) setRepeatDom(Number(today.split("-")[2]));
  }

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);

    const payload = {
      user_id: userId,
      title: title.trim(),
      description: note.trim() || null,
      importance,
      status: "pending",
      category: finalCategory,
      task_type: "individual",
      due_date: repeat === "none" ? dueDate : null,
      due_time: repeat === "interval" ? null : dueTime,
      recurrence: repeat === "none" ? null : repeat,
      repeat_days: repeat === "weekly" ? repeatDays : null,
      repeat_dom: repeat === "monthly" ? repeatDom : null,
      repeat_every_min: repeat === "interval" ? everyMin : null,
      window_start: repeat === "interval" ? winStart : null,
      window_end: repeat === "interval" ? winEnd : null,
    };

    const supabase = createClient();
    const { data, error } = await supabase.from("tasks").insert(payload).select().single();

    if (error || !data) { setError(error?.message ?? "Could not save the task."); setSaving(false); return; }

    // best-effort push to Google Calendar; the task itself is already saved
    let googleEventId: string | null = null;
    if (canPushToGcal && addToGcal && dueDate) {
      try {
        googleEventId = await createGoogleEvent({
          title: data.title, date: dueDate, time: dueTime, description: data.description,
        });
        await supabase.from("tasks").update({ google_event_id: googleEventId }).eq("id", data.id);
      } catch { /* Google hiccup shouldn't block the task */ }
    }

    onCreated({
      id: data.id, title: data.title, description: data.description, category: data.category,
      importance: data.importance, due_date: data.due_date, due_time: data.due_time,
      recurrence: data.recurrence, repeat_days: data.repeat_days, repeat_dom: data.repeat_dom,
      repeat_every_min: data.repeat_every_min, window_start: data.window_start, window_end: data.window_end,
      is_done: data.is_done, last_done_on: data.last_done_on, completed_at: data.completed_at,
      snoozed_until: data.snoozed_until ?? null, skipped_on: data.skipped_on ?? null, subtasks: data.subtasks ?? [],
      google_event_id: googleEventId,
    });
    onClose();
  }

  const repeatOptions: { value: Repeat; label: string }[] = [
    { value: "none", label: "Once" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "interval", label: "Every…" },
  ];

  const chip = (active: boolean) =>
    cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
      active ? "border-foreground bg-foreground text-background"
        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground");

  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="font-heading text-lg font-bold">New task</h2>
        <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && canSave) handleSave(); }}
          placeholder="What do you need to do?"
          className="w-full bg-transparent text-lg font-medium outline-none placeholder:text-muted-foreground/60" />

        {showNote ? (
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" rows={2}
            className="mt-2 w-full resize-none rounded-xl border border-border bg-transparent px-3 py-2 text-sm outline-none transition focus:border-foreground/30 placeholder:text-muted-foreground/60" />
        ) : (
          <button type="button" onClick={() => setShowNote(true)} className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition hover:text-foreground">
            <Plus className="size-3.5" /> Add note
          </button>
        )}

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</p>
          <div className="flex flex-wrap gap-1.5">
            {DEFAULT_CATEGORIES.map(({ name, Icon }) => {
              const active = !customMode && category === name;
              return (
                <button key={name} type="button" onClick={() => { setCustomMode(false); setCategory(active ? "" : name); }} className={chip(active)}>
                  <Icon className="size-3.5" /> {name}
                </button>
              );
            })}
            {knownCategories
              .filter((c) => !DEFAULT_CATEGORIES.some((d) => d.name.toLowerCase() === c.toLowerCase()))
              .map((c) => {
                const active = !customMode && category === c;
                return (
                  <button key={c} type="button" onClick={() => { setCustomMode(false); setCategory(active ? "" : c); }} className={chip(active)}>
                    <Tag className="size-3.5" /> {c}
                  </button>
                );
              })}
            <button type="button" onClick={() => { setCustomMode(true); setCategory(""); }}
              className={cn("inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                customMode ? "border-foreground text-foreground" : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground")}>
              <Plus className="size-3.5" /> Custom
            </button>
          </div>
          {customMode && (
            <input autoFocus value={customValue} onChange={(e) => setCustomValue(e.target.value)} placeholder="Type a category…"
              className="mt-2 h-9 w-full rounded-[8px] border border-input bg-transparent px-3 text-sm outline-none transition focus:border-foreground/30 placeholder:text-muted-foreground/60" />
          )}
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Repeat</p>
          <div className="flex flex-wrap gap-1.5">
            {repeatOptions.map((o) => (
              <button key={o.value} type="button" onClick={() => pickRepeat(o.value)}
                className={cn("rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  repeat === o.value ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground")}>
                {o.label}
              </button>
            ))}
          </div>

          {repeat === "weekly" && (
            <div className="mt-3 flex gap-1.5">
              {DAY_LABELS.map((d, i) => {
                const active = repeatDays.includes(i);
                return (
                  <button key={i} type="button" onClick={() => toggleDay(i)}
                    className={cn("grid size-9 flex-1 place-items-center rounded-full border text-xs font-semibold transition",
                      active ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground")}>
                    {d}
                  </button>
                );
              })}
            </div>
          )}

          {repeat === "monthly" && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <span>On day</span>
              <select value={repeatDom ?? Number(today.split("-")[2])} onChange={(e) => setRepeatDom(Number(e.target.value))} className={selectCls}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <span>of each month</span>
            </div>
          )}

          {repeat === "interval" && (
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Remind me every</span>
                <select value={everyMin} onChange={(e) => setEveryMin(Number(e.target.value))} className={selectCls}>
                  {EVERY.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>From</span>
                <select value={winStart} onChange={(e) => setWinStart(e.target.value)} className={selectCls}>
                  {SLOTS.map((s) => <option key={s} value={s}>{formatTime(s)}</option>)}
                </select>
                <span>to</span>
                <select value={winEnd} onChange={(e) => setWinEnd(e.target.value)} className={selectCls}>
                  {SLOTS.map((s) => <option key={s} value={s}>{formatTime(s)}</option>)}
                </select>
              </div>
              <p className="text-xs text-muted-foreground">
                {intervalInvalid ? "The end time needs to be after the start time." : `A nudge every ${EVERY.find((e) => e.v === everyMin)?.label} between those hours.`}
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 space-y-2">
          {repeat === "none" && (
            <div className="rounded-2xl border border-border">
              <button type="button" onClick={() => { setShowCal((s) => !s); setShowTime(false); }} className="flex w-full items-center justify-between px-3 py-2.5 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="size-4" /> When</span>
                <span className="font-medium">{dueDate ? formatDateLabel(dueDate, today) : "Anytime"}</span>
              </button>
              {showCal && <div className="px-2 pb-2"><DatePicker value={dueDate} onChange={setDueDate} /></div>}
            </div>
          )}

          {repeat !== "interval" && (
            <div className="rounded-2xl border border-border">
              <button type="button" onClick={() => { setShowTime((s) => !s); setShowCal(false); }} className="flex w-full items-center justify-between px-3 py-2.5 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground"><Clock className="size-4" /> Time</span>
                <span className="font-medium">{dueTime ? formatTime(dueTime) : "No time"}</span>
              </button>
              {showTime && <div className="px-2 pb-2"><TimePicker value={dueTime} onChange={setDueTime} /></div>}
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          <button type="button" onClick={() => setImportance((p) => (p === "high" ? "normal" : "high"))}
            className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
              importance === "high" ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground")}>
            <Flag className="size-3.5" />
            {importance === "high" ? "High priority" : "Mark high priority"}
          </button>
          {canPushToGcal && (
            <button type="button" onClick={() => setAddToGcal((p) => !p)}
              className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                addToGcal ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground")}>
              <CalendarDays className="size-3.5" />
              {addToGcal ? "Adding to Google Calendar" : "Add to Google Calendar"}
            </button>
          )}
        </div>

        {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">{error}</p>}
      </div>

      <div className="border-t border-border px-5 py-4">
        <button type="button" onClick={handleSave} disabled={!canSave}
          className="w-full rounded-full bg-foreground py-2.5 text-sm font-semibold text-background transition hover:bg-foreground/90 disabled:opacity-40">
          {saving ? "Adding…" : "Add task"}
        </button>
        {weeklyInvalid && <p className="mt-2 text-center text-xs text-muted-foreground">Pick at least one day for a weekly task.</p>}
      </div>
    </>
  );
}
