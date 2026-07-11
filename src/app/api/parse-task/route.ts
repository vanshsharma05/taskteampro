import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// AI-powered task parsing: one casual sentence in, a structured task out.
// Runs Llama 3.1 (open-source) on Groq's free tier — get a key at
// https://console.groq.com (no card needed) and set GROQ_API_KEY.
// The client falls back to the on-device parser if this route is
// unavailable, so a missing key or an API hiccup never breaks quick add.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// 70B gets date arithmetic right where 8B doesn't; still free (~1k req/day)
const MODEL = "llama-3.3-70b-versatile";

function istToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

function buildSystem(categories: string[]): string {
  return `You convert one casual sentence (typed or dictated) into a task object.
Today is ${istToday()} in the Asia/Kolkata timezone.
Known categories: ${categories.join(", ")}.

Respond with ONLY a JSON object, no other text, in exactly this shape:
{
  "title": string,                     // what the user needs to DO — scheduling words and filler ("remind me to", "please") removed
  "due_date": string | null,           // "YYYY-MM-DD"; null if recurring
  "due_time": string | null,           // "HH:MM" 24-hour; null if none
  "recurrence": "daily" | "weekly" | "monthly" | "interval" | null,
  "repeat_days": number[] | null,      // weekdays 0=Sunday..6=Saturday, only for weekly
  "repeat_dom": number | null,         // day of month 1-31, only for monthly
  "repeat_every_min": number | null,   // minutes between reminders 15-240, only for interval
  "importance": "normal" | "high",
  "category": string | null            // one of the known categories, or null
}

Rules:
- Resolve relative dates ("tomorrow", "next friday", "in 3 days") against today's date. If a stated date already passed this year, use next year.
- One-off tasks default to today's date when no date is given. Recurring tasks have due_date null.
- "every half hour" / "every 2 hours" style requests are recurrence "interval" with repeat_every_min. Interval tasks have due_time null.
- Words like "urgent", "important", "asap" mean importance "high".
- Pick a category only when the task clearly fits one; otherwise null.
- Times with no am/pm: 1-7 usually mean afternoon/evening (add 12), 8-12 mean morning.`;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Whitelist + clamp everything before it can reach the database. */
function sanitize(raw: any, categories: string[]) {
  const title = typeof raw?.title === "string" ? raw.title.trim().slice(0, 300) : "";
  if (!title) return null;

  const recurrence = ["daily", "weekly", "monthly", "interval"].includes(raw.recurrence) ? raw.recurrence : null;
  const dateOk = typeof raw.due_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.due_date);
  const timeOk = typeof raw.due_time === "string" && /^\d{2}:\d{2}$/.test(raw.due_time);
  const days = Array.isArray(raw.repeat_days)
    ? Array.from(new Set(raw.repeat_days.filter((d: unknown): d is number => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6))).sort()
    : null;
  const dom = Number.isInteger(raw.repeat_dom) && raw.repeat_dom >= 1 && raw.repeat_dom <= 31 ? raw.repeat_dom : null;
  const everyMin = Number.isInteger(raw.repeat_every_min)
    ? Math.max(15, Math.min(240, raw.repeat_every_min)) : null;
  const category = typeof raw.category === "string"
    ? categories.find((c) => c.toLowerCase() === raw.category.toLowerCase()) ?? null : null;

  return {
    title,
    due_date: recurrence ? null : (dateOk ? raw.due_date : istToday()),
    due_time: recurrence === "interval" ? null : (timeOk ? raw.due_time : null),
    recurrence,
    repeat_days: recurrence === "weekly" ? (days?.length ? days : [new Date().getDay()]) : null,
    repeat_dom: recurrence === "monthly" ? (dom ?? Number(istToday().split("-")[2])) : null,
    repeat_every_min: recurrence === "interval" ? (everyMin ?? 30) : null,
    window_start: recurrence === "interval" ? "09:00" : null,
    window_end: recurrence === "interval" ? "21:00" : null,
    importance: raw.importance === "high" ? "high" : "normal",
    category,
  };
}

export async function POST(request: Request) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "AI parsing is not configured" }, { status: 503 });
  }

  // signed-in users only — this endpoint spends the free-tier quota
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to use AI parsing" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const categories: string[] = Array.isArray(body?.categories)
    ? body.categories.filter((c: unknown) => typeof c === "string").slice(0, 30)
    : [];
  if (!text || text.length > 500) {
    return NextResponse.json({ error: "Provide a task sentence (max 500 chars)" }, { status: 400 });
  }

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        max_tokens: 512,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildSystem(categories) },
          { role: "user", content: text },
        ],
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) throw new Error(`Groq API error ${res.status}`);

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    const task = typeof content === "string" ? sanitize(JSON.parse(content), categories) : null;
    if (!task) return NextResponse.json({ error: "Could not parse that sentence" }, { status: 422 });

    return NextResponse.json({ task });
  } catch {
    // timeouts, rate limits, network — the client falls back to local parsing
    return NextResponse.json({ error: "AI parsing is temporarily unavailable" }, { status: 502 });
  }
}
