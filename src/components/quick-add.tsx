"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Plus, CalendarDays, Clock, Repeat, Flag, Tag, CornerDownLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import { parseQuickAdd, type ParsedTask } from "@/lib/quick-add";
import { hasGoogleToken, createGoogleEvent } from "@/lib/google-calendar";
import {
  DEFAULT_CATEGORIES, istToday, formatTime, formatDateLabel,
  type PersonalTask,
} from "@/lib/personal";

/**
 * Server-side AI parse (Claude). Returns null on any failure so the caller
 * can fall back to the on-device parser — quick add never hard-fails.
 */
async function aiParse(text: string, categories: string[]): Promise<ParsedTask | null> {
  try {
    const res = await fetch("/api/parse-task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, categories }),
      signal: AbortSignal.timeout(9_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.task && typeof data.task.title === "string" && data.task.title ? data.task as ParsedTask : null;
  } catch {
    return null;
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type SpeechRec = {
  lang: string; interimResults: boolean; maxAlternatives: number;
  onresult: ((e: any) => void) | null; onend: (() => void) | null; onerror: ((e: any) => void) | null;
  start(): void; stop(): void;
};

function getSpeechRecognition(): (new () => SpeechRec) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * One-sentence capture: "call mom tomorrow at 5pm high priority".
 * Type it or say it — the sentence is parsed on-device into a scheduled task.
 */
export function QuickAdd({ userId, knownCategories, onCreated }: {
  userId: string; knownCategories: string[]; onCreated: (t: PersonalTask) => void;
}) {
  const today = istToday();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRec | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // detect support after mount so server and first client render agree
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) setVoiceSupported(getSpeechRecognition() !== null); });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => () => { recRef.current?.stop(); }, []);

  const parsed = text.trim() ? parseQuickAdd(text, knownCategories, today) : null;

  function toggleVoice() {
    if (listening) { recRef.current?.stop(); return; }
    const SR = getSpeechRecognition();
    if (!SR) return;
    setError(null);
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results as ArrayLike<any>)
        .map((r: any) => r[0]?.transcript ?? "").join(" ").trim();
      if (transcript) setText(transcript);
    };
    rec.onend = () => { setListening(false); inputRef.current?.focus(); };
    rec.onerror = (e: any) => {
      setListening(false);
      setError(e?.error === "not-allowed"
        ? "Microphone is blocked — allow it for this site in your browser."
        : "Couldn't hear that — try again or just type.");
    };
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  async function save() {
    if (!parsed || !parsed.title || saving) return;
    setSaving(true);
    setError(null);

    // AI understands messier phrasing; the local parse is the safety net
    const allCategories = [...DEFAULT_CATEGORIES.map((c) => c.name), ...knownCategories];
    const final = (await aiParse(text, allCategories)) ?? parsed;

    const payload = {
      user_id: userId,
      title: final.title,
      description: null,
      importance: final.importance,
      status: "pending",
      category: final.category,
      task_type: "individual",
      due_date: final.due_date,
      due_time: final.due_time,
      recurrence: final.recurrence,
      repeat_days: final.recurrence === "weekly" ? final.repeat_days : null,
      repeat_dom: final.recurrence === "monthly" ? final.repeat_dom : null,
      repeat_every_min: final.recurrence === "interval" ? final.repeat_every_min : null,
      window_start: final.recurrence === "interval" ? final.window_start : null,
      window_end: final.recurrence === "interval" ? final.window_end : null,
    };

    const supabase = createClient();
    const { data, error } = await supabase.from("tasks").insert(payload).select().single();
    if (error || !data) {
      setError(error?.message ?? "Couldn't save the task.");
      setSaving(false);
      return;
    }

    let googleEventId: string | null = null;
    if (hasGoogleToken() && !final.recurrence && final.due_date) {
      try {
        googleEventId = await createGoogleEvent({
          title: data.title, date: final.due_date, time: final.due_time, description: null,
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
      snoozed_until: null, skipped_on: null, subtasks: data.subtasks ?? [],
      google_event_id: googleEventId,
    });
    setText("");
    setSaving(false);
    inputRef.current?.focus();
  }

  const intervalLabel = (min: number) => min % 60 === 0 ? `${min / 60} hr` : `${min} min`;
  const repeatLabel = parsed?.recurrence === "daily" ? "Every day"
    : parsed?.recurrence === "weekly" ? (parsed.repeat_days ?? []).map((d) => DAY_SHORT[d]).join(", ") || "Weekly"
    : parsed?.recurrence === "monthly" ? `Monthly on the ${parsed.repeat_dom}`
    : parsed?.recurrence === "interval" && parsed.repeat_every_min
      ? `Every ${intervalLabel(parsed.repeat_every_min)}, 9 AM–9 PM` : null;

  return (
    <div className="mb-5">
      <div className={cn("flex items-center gap-2 rounded-2xl border bg-card px-3 py-2 transition",
        listening ? "border-red-400 ring-1 ring-red-400/30" : "border-border focus-within:border-foreground/30")}>
        <Plus className="size-4 shrink-0 text-muted-foreground" />
        <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setText(""); }}
          placeholder={listening ? "Listening… say your task" : 'Try "call mom tomorrow at 5pm"'}
          className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
        {voiceSupported && (
          <button type="button" onClick={toggleVoice}
            aria-label={listening ? "Stop listening" : "Add task by voice"}
            className={cn("relative shrink-0 rounded-full p-2 transition after:absolute after:-inset-1 after:content-['']",
              listening ? "animate-pulse bg-red-500 text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            <Mic className="size-4" />
          </button>
        )}
        {text.trim() && (
          <button type="button" onClick={save} disabled={saving || !parsed?.title}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition hover:bg-foreground/90 disabled:opacity-40">
            {saving ? "Adding…" : <>Add <CornerDownLeft className="size-3" /></>}
          </button>
        )}
      </div>

      {/* live preview of what was understood */}
      {parsed && parsed.title && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 px-2 text-[12px] text-muted-foreground">
          <span className="font-medium text-foreground">{parsed.title}</span>
          {parsed.due_date && !parsed.recurrence && (
            <span className="inline-flex items-center gap-1"><CalendarDays className="size-3" />{formatDateLabel(parsed.due_date, today)}</span>
          )}
          {parsed.due_time && (
            <span className="inline-flex items-center gap-1"><Clock className="size-3" />{formatTime(parsed.due_time)}</span>
          )}
          {repeatLabel && (
            <span className="inline-flex items-center gap-1"><Repeat className="size-3" />{repeatLabel}</span>
          )}
          {parsed.importance === "high" && (
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400"><Flag className="size-3" />High</span>
          )}
          {parsed.category && (
            <span className="inline-flex items-center gap-1"><Tag className="size-3" />{parsed.category}</span>
          )}
        </div>
      )}
      {error && <p className="mt-1.5 px-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
