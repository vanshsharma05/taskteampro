import { addDays, dayOfWeek, istToday, DEFAULT_CATEGORIES, type Recurrence } from "@/lib/personal";

// One-sentence task parser: "call mom tomorrow at 5pm", "gym every mon and wed 7am",
// "13 july visit a friend at 9am", "drink water every half hour".
// Deterministic and on-device — no network, no API key.

export interface ParsedTask {
  title: string;
  due_date: string | null;
  due_time: string | null;
  recurrence: Recurrence;
  repeat_days: number[] | null;
  repeat_dom: number | null;
  repeat_every_min: number | null;
  window_start: string | null;
  window_end: string | null;
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

const MONTHS: Record<string, number> = {
  january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4,
  may: 5, june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8,
  september: 9, sept: 9, sep: 9, october: 10, oct: 10, november: 11, nov: 11, december: 12, dec: 12,
};
const MONTH_RE = "january|february|march|april|august|september|october|november|december|june|july|jan|feb|mar|apr|may|jun|jul|aug|sept|sep|oct|nov|dec";

// voice transcripts often spell small numbers out: "at nine am"
const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
};
const NUM_RE = "\\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve";

function toNum(s: string): number {
  const n = Number(s);
  return Number.isFinite(n) ? n : NUMBER_WORDS[s.toLowerCase()] ?? NaN;
}

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

/** Builds YYYY-MM-DD from day/month, rolling to next year if it already passed. */
function explicitDate(day: number, month: number, year: number | null, today: string): string | null {
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  const y = year ?? Number(today.split("-")[0]);
  let d = `${y}-${pad(month)}-${pad(day)}`;
  if (!year && d < today) d = `${y + 1}-${pad(month)}-${pad(day)}`;
  return d;
}

export function parseQuickAdd(input: string, knownCategories: string[] = [], today = istToday()): ParsedTask {
  // normalize voice quirks: "a.m." → "am", "p.m." → "pm"
  let text = ` ${input} `.replace(/\b([ap])\.\s?m\.?/gi, "$1m");

  const out: ParsedTask = {
    title: "", due_date: today, due_time: null,
    recurrence: null, repeat_days: null, repeat_dom: null,
    repeat_every_min: null, window_start: null, window_end: null,
    importance: "normal", category: null,
  };

  const eat = (re: RegExp, onMatch: (m: RegExpMatchArray) => void): boolean => {
    const m = text.match(re);
    if (!m) return false;
    onMatch(m);
    text = text.replace(re, " ");
    return true;
  };

  // ---- interval repeats: "every half hour", "every 2 hours", "every 45 min", "hourly" ----
  const setInterval = (mins: number) => {
    out.recurrence = "interval";
    out.repeat_every_min = Math.max(15, Math.min(mins, 240));   // matches the app's 15min–4h range
    out.window_start = "09:00";
    out.window_end = "21:00";
  };
  eat(/\b(?:after\s+)?every\s+half\s+(?:an\s+)?(?:hour|hr)\b/i, () => setInterval(30));
  if (!out.recurrence) eat(new RegExp(`\\b(?:after\\s+)?every\\s+(${NUM_RE})\\s*(?:hours?|hrs?)\\b`, "i"), (m) => setInterval(toNum(m[1]) * 60));
  if (!out.recurrence) eat(/\b(?:after\s+)?every\s+(\d{1,3})\s*(?:minutes?|mins?)\b/i, (m) => setInterval(Number(m[1])));
  if (!out.recurrence) eat(/\b(?:after\s+)?every\s+(?:hour|hr)\b|\bhourly\b/i, () => setInterval(60));

  // ---- other repeats ----
  if (!out.recurrence) eat(/\bevery\s*day\b|\bdaily\b/i, () => { out.recurrence = "daily"; });
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
  const setDate = (d: string | null) => { if (d) { out.due_date = d; dateSet = true; } };

  // "13 july", "13th of july 2026"
  eat(new RegExp(`\\b(?:on\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${MONTH_RE})(?:\\s+(\\d{4}))?\\b`, "i"), (m) => {
    setDate(explicitDate(Number(m[1]), MONTHS[m[2].toLowerCase()], m[3] ? Number(m[3]) : null, today));
  });
  // "july 13", "july 13th 2026"
  if (!dateSet) {
    eat(new RegExp(`\\b(?:on\\s+)?(${MONTH_RE})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+(\\d{4}))?\\b`, "i"), (m) => {
      setDate(explicitDate(Number(m[2]), MONTHS[m[1].toLowerCase()], m[3] ? Number(m[3]) : null, today));
    });
  }
  // "13/7" or "13/07/2026" (day first)
  if (!dateSet) {
    eat(/\b(?:on\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/, (m) => {
      const year = m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : null;
      setDate(explicitDate(Number(m[1]), Number(m[2]), year, today));
    });
  }
  // "on the 13th" → that day this month, or next month if it already passed
  if (!dateSet) {
    eat(/\bon\s+the\s+(\d{1,2})(?:st|nd|rd|th)?\b/i, (m) => {
      const [y, mo] = today.split("-").map(Number);
      const day = Number(m[1]);
      if (day < 1 || day > 31) return;
      let d = `${y}-${pad(mo)}-${pad(day)}`;
      if (d < today) {
        const nm = mo === 12 ? { y: y + 1, mo: 1 } : { y, mo: mo + 1 };
        d = `${nm.y}-${pad(nm.mo)}-${pad(day)}`;
      }
      setDate(d);
    });
  }

  // ---- relative dates ----
  if (!dateSet) eat(/\b(?:on|by|for)?\s*day after tomorrow\b/i, () => setDate(addDays(today, 2)));
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
  if (!dateSet) eat(new RegExp(`\\bin\\s+(${NUM_RE})\\s+days?\\b`, "i"), (m) => setDate(addDays(today, toNum(m[1]))));

  // ---- times ----
  if (!out.due_time) {
    // "at 5", "at nine:30pm" — 'at' makes a bare number safe to treat as a time
    eat(new RegExp(`\\bat\\s+(${NUM_RE})(?::(\\d{2}))?\\s*(am|pm)?\\b`, "i"), (m) => {
      out.due_time = composeTime(toNum(m[1]), Number(m[2] ?? 0), m[3]?.toLowerCase() ?? null);
    });
  }
  if (!out.due_time) {
    // "5pm", "nine 30 am" — meridiem required when there's no 'at'
    eat(new RegExp(`\\b(${NUM_RE})(?::(\\d{2}))?\\s*(am|pm)\\b`, "i"), (m) => {
      out.due_time = composeTime(toNum(m[1]), Number(m[2] ?? 0), m[3].toLowerCase());
    });
  }
  if (!out.due_time) {
    eat(/\b(?:at|in the)\s+(noon|midnight|morning|afternoon|evening|night)\b/i, (m) => {
      out.due_time = WORD_TIMES[m[1].toLowerCase()];
    });
  }
  if (!out.due_time) {
    eat(new RegExp(`\\bin\\s+(?:(half)\\s+(?:an\\s+)?|(an)\\s+|(${NUM_RE})\\s*)(hours?|hrs?|minutes?|mins?)\\b`, "i"), (m) => {
      const unitIsHour = /h/i.test(m[4]);
      const n = m[1] ? 0.5 : m[2] ? 1 : toNum(m[3]);
      const mins = Math.round(unitIsHour ? n * 60 : n);
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

  // recurring tasks don't keep a one-off date; interval reminders have no fixed time
  if (out.recurrence) out.due_date = null;
  if (out.recurrence === "interval") out.due_time = null;

  // ---- title = whatever's left ----
  let title = text
    .replace(/\b(?:remind me to|remind me|please)\b/gi, " ")
    .replace(/^\s*(?:add (?:a )?task(?: to)?|i (?:need|have|want) to)\b/i, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[,.\-–]+|[,.\-–]+$/g, "")
    .replace(/^(?:at|on|by|for|in|to|after)\s+/i, "")
    .replace(/\s+(?:at|on|by|for|in|to|after)$/i, "")
    .trim();
  if (title) title = title[0].toUpperCase() + title.slice(1);
  out.title = title;

  return out;
}
