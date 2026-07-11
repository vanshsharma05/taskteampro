import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";

// AI-powered task parsing: one casual sentence in, a structured task out.
// The client falls back to the on-device parser if this route is
// unavailable, so a missing key or a Claude hiccup never breaks quick add.

const TASK_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Short imperative task title, filler words removed" },
    due_date: { type: ["string", "null"], description: "YYYY-MM-DD, null if no date or recurring" },
    due_time: { type: ["string", "null"], description: "HH:MM 24h, null if none" },
    recurrence: { type: ["string", "null"], enum: ["daily", "weekly", "monthly", "interval", null] },
    repeat_days: { type: ["array", "null"], items: { type: "integer" }, description: "Weekdays 0=Sunday..6=Saturday, only for weekly" },
    repeat_dom: { type: ["integer", "null"], description: "Day of month 1-31, only for monthly" },
    repeat_every_min: { type: ["integer", "null"], description: "Minutes between reminders, only for interval (15-240)" },
    importance: { type: "string", enum: ["normal", "high"] },
    category: { type: ["string", "null"], description: "One of the known categories, or null" },
  },
  required: ["title", "due_date", "due_time", "recurrence", "repeat_days", "repeat_dom", "repeat_every_min", "importance", "category"],
  additionalProperties: false,
} as const;

function istToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

function buildSystem(categories: string[]): string {
  return `You convert one casual sentence (typed or dictated) into a task object.
Today is ${istToday()} in the Asia/Kolkata timezone.
Known categories: ${categories.join(", ")}.

Rules:
- The title is what the user needs to DO, with scheduling words and filler ("remind me to", "please") removed. Keep it short and natural.
- Resolve relative dates ("tomorrow", "next friday", "in 3 days") against today's date. If a stated date already passed this year, use next year.
- One-off tasks default to today when no date is given. Recurring tasks have due_date null.
- "every half hour" / "every 2 hours" style requests are recurrence "interval" with repeat_every_min (clamp 15-240). Interval tasks have due_time null.
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
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI parsing is not configured" }, { status: 503 });
  }

  // signed-in users only — this endpoint spends API credits
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
    const client = new Anthropic({ timeout: 8_000, maxRetries: 1 });
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      system: buildSystem(categories),
      output_config: { format: { type: "json_schema", schema: TASK_SCHEMA } },
      messages: [{ role: "user", content: text }],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ error: "Could not parse that sentence" }, { status: 422 });
    }
    const block = response.content.find((b) => b.type === "text");
    const task = block ? sanitize(JSON.parse(block.text), categories) : null;
    if (!task) return NextResponse.json({ error: "Could not parse that sentence" }, { status: 422 });

    return NextResponse.json({ task });
  } catch {
    // timeouts, rate limits, network — the client falls back to local parsing
    return NextResponse.json({ error: "AI parsing is temporarily unavailable" }, { status: 502 });
  }
}
