import { addDays, dayOfWeek, istToday, DEFAULT_CATEGORIES, type Recurrence } from "@/lib/personal";

// One-sentence task parser: "call mom tomorrow at 5pm", "gym every mon and wed 7am",
// "pay rent monthly on the 1st", "submit report friday high priority".
// Deterministic and on-device — no network, no API key.

export interface ParsedTask {
  title: string;
  due_date: string | null;
  due_time: string | null;
  recurrence: Recurrence;
  repeat_days: number[] | null;
  repeat_dom: number | null;
  importance: "normal" | "high";
  category: string | null;
}

const WEEKDAYS: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};
const WEEKDAY_RE = "sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tues|tue|wed|thurs|thur|thu|fri|sat";

const WORD_TIMES: Record<string, string> = {
  noon: "12:00", midnight: "00:00",
  morning: "09:00", afternoon: "15:00", evening: "18:00", night: "21:00", tonight: "20:00",
};

function pad(n: number): string { return String(n).padStart(2, "0"); }

function composeTime(hRaw: number, min: number, meridiem: string | null): string | null {
  let h = hRaw;
  if (meridiem === "pm" && h < 12) h += 12;
  if (meridiem === "am" && h === 12) h = 0;
  // "at 5" with no am/pm: small hours almost always mean the afternoon/evening
  if (!meridiem && h >= 1 && h <= 7) h += 12;
  if (h > 23 || min > 59) return null;
  return `${pad(h)}:${pad(min)}`;
}

function nextWeekday(today: string, target: number, forceNext: boolean): string {
  const todayDow = dayOfWeek(today);
  let diff = (target - todayDow + 7) % 7;
  if (diff === 0 && forceNext) diff = 7;
  return addDays(today, diff);
}

export function parseQuickAdd(input: string, knownCategories: string[] = [], today = istToday()): ParsedTask {
  let text = ` ${input} `;
  const out: ParsedTask = {
    title: "", due_date: today, due_time: null,
    recurrence: null, repeat_days: null, repeat_dom: null,
    importance: "normal", category: null,
  };

  const eat = (re: RegExp, onMatch: (m: RegExpMatchArray) => void): boolean => {
    const m = text.match(re);
    if (!m) return false;
    onMatch(m);
    text = text.replace(re, " ");
    return true;
  };

  // ---- recurrence ----
  eat(/\bevery\s*day\b|\bdaily\b/i, () => { out.recurrence = "daily"; });
  if (!out.recurrence) {
    eat(new RegExp(`\\bevery\\s+((?:${WEEKDAY_RE})(?:\\s*(?:,|and|&)\\s*(?:${WEEKDAY_RE}))*)\\b`, "i"), (m) => {
      const days = Array.from(m[1].toLowerCase().matchAll(new RegExp(`\\b(${WEEKDAY_RE})\\b`, "g")))
        .map((d) => WEEKDAYS[d[1]]);
      out.recurrence = "weekly";
      out.repeat_days = Array.from(new Set(days)).sort((a, b) => a - b);
    });
  }
  if (!out.recurrence) {
    eat(/\bevery\s+month(?:\s+on(?:\s+the)?\s+(\d{1,2})(?:st|nd|rd|th)?)?\b|\bmonthly(?:\s+on(?:\s+the)?\s+(\d{1,2})(?:st|nd|rd|th)?)?\b/i, (m) => {
      out.recurrence = "monthly";
      const dom = Number(m[1] ?? m[2]);
      out.repeat_dom = Number.isFinite(dom) && dom >= 1 && dom <= 31 ? dom : Number(today.split("-")[2]);
    });
  }
  if (!out.recurrence) {
    eat(/\bevery\s+week\b|\bweekly\b/i, () => {
      out.recurrence = "weekly";
      out.repeat_days = [dayOfWeek(today)];
    });
  }
  if (!out.recurrence) {
    eat(/\bevery\s+(morning|afternoon|evening|night)\b/i, (m) => {
      out.recurrence = "daily";
      out.due_time = WORD_TIMES[m[1].toLowerCase()];
    });
  }

  // ---- explicit dates ----
  let dateSet = false;
  const setDate = (d: string) => { out.due_date = d; dateSet = true; };

  eat(/\b(?:on|by|for)?\s*day after tomorrow\b/i, () => setDate(addDays(today, 2)));
  if (!dateSet) eat(/\b(?:on|by|for)?\s*(?:tomorrow|tmrw|tmr)\b/i, () => setDate(addDays(today, 1)));
  if (!dateSet) eat(/\b(?:on|by|for)?\s*today\b/i, () => setDate(today));
  if (!dateSet) {
    eat(/\btonight\b/i, () => {
      setDate(today);
      if (!out.due_time) out.due_time = WORD_TIMES.tonight;
    });
  }
  if (!dateSet) eat(/\bnext\s+week\b/i, () => setDate(addDays(today, 7)));
  if (!dateSet) {
    eat(new RegExp(`\\b(?:on|by|for)?\\s*(next\\s+)?(${WEEKDAY_RE})\\b`, "i"), (m) => {
      setDate(nextWeekday(today, WEEKDAYS[m[2].toLowerCase()], !!m[1]));
    });
  }
  if (!dateSet) eat(/\bin\s+(\d{1,2})\s+days?\b/i, (m) => setDate(addDays(today, Number(m[1]))));

  // ---- times ----
  if (!out.due_time) {
    // "at 5", "at 5:30pm" — 'at' makes a bare number safe to treat as a time
    eat(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i, (m) => {
      out.due_time = composeTime(Number(m[1]), Number(m[2] ?? 0), m[3]?.toLowerCase() ?? null);
    });
  }
  if (!out.due_time) {
    // "5pm", "5:30 am" — meridiem required when there's no 'at'
    eat(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i, (m) => {
      out.due_time = composeTime(Number(m[1]), Number(m[2] ?? 0), m[3].toLowerCase());
    });
  }
  if (!out.due_time) {
    eat(/\b(?:at|in the)\s+(noon|midnight|morning|afternoon|evening|night)\b/i, (m) => {
      out.due_time = WORD_TIMES[m[1].toLowerCase()];
    });
  }
  if (!out.due_time) {
    eat(/\bin\s+(\d{1,2})\s*(hours?|hrs?|minutes?|mins?)\b/i, (m) => {
      const n = Number(m[1]);
      const mins = /h/i.test(m[2]) ? n * 60 : n;
      const now = new Date(Date.now() + mins * 60_000);
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false,
      }).formatToParts(now);
      const h = parts.find((p) => p.type === "hour")?.value ?? "09";
      const mm = parts.find((p) => p.type === "minute")?.value ?? "00";
      out.due_time = `${h === "24" ? "00" : h}:${mm}`;
    });
  }

  // ---- priority ----
  eat(/\b(?:high priority|urgent|important|asap)\b|!!/i, () => { out.importance = "high"; });

  // ---- category: recognized but NOT stripped from the title ----
  const cats = [...DEFAULT_CATEGORIES.map((c) => c.name), ...knownCategories];
  for (const c of cats) {
    if (new RegExp(`\\b${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text)) {
      out.category = c;
      break;
    }
  }

  // recurring tasks don't keep a one-off date
  if (out.recurrence) out.due_date = null;

  // ---- title = whatever's left ----
  let title = text
    .replace(/^\s*(?:remind me to|remind me|add (?:a )?task(?: to)?|i (?:need|have|want) to)\b/i, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[,.\-–]+|[,.\-–]+$/g, "")
    .replace(/\s+(?:at|on|by|for|in|to)$/i, "")
    .trim();
  if (title) title = title[0].toUpperCase() + title.slice(1);
  out.title = title;

  return out;
}
