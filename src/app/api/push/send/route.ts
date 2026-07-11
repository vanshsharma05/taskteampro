import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { istToday, occursOn, formatTime, type PersonalTask } from "@/lib/personal";

// The notification brain. Called every minute by pg_cron (x-cron-secret).
// Sends only what deserves attention:
//   - a timed task at its due minute
//   - interval reminders on their cadence, inside their window
//   - a snoozed task the minute it wakes
//   - one morning brief at 08:00 IST (only if there's something to say)
// Done, skipped, and snoozed tasks never fire. Tags dedupe per minute.

export const dynamic = "force-dynamic";

type Row = PersonalTask & { user_id: string };
type Note = { user_id: string; title: string; body: string; tag: string };

function istParts() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  const hh = h === "24" ? "00" : h;
  return { hhmm: `${hh}:${m}`, nowMin: Number(hh) * 60 + Number(m) };
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

function isQuietToday(t: Row, today: string): boolean {
  const doneToday = t.recurrence ? t.last_done_on === today : t.is_done;
  const snoozed = !!t.snoozed_until && new Date(t.snoozed_until).getTime() > Date.now();
  const skipped = !!t.skipped_on && (t.recurrence ? t.skipped_on === today : true);
  return doneToday || snoozed || skipped;
}

async function handle(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vapidPub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPriv = process.env.VAPID_PRIVATE_KEY;
  if (!url || !serviceKey || !vapidPub || !vapidPriv) {
    return NextResponse.json({ error: "Push is not configured" }, { status: 503 });
  }

  webpush.setVapidDetails("mailto:hello@taskteampro.com", vapidPub, vapidPriv);
  const db = createServiceClient(url, serviceKey, { auth: { persistSession: false } });

  const today = istToday();
  const { hhmm, nowMin } = istParts();
  const notes: Note[] = [];

  // ---- timed tasks due this exact minute ----
  const { data: timed } = await db.from("tasks")
    .select("*")
    .eq("due_time", `${hhmm}:00`)
    .neq("recurrence", "interval")
    .eq("task_type", "individual");
  for (const t of (timed ?? []) as Row[]) {
    if (isQuietToday(t, today)) continue;
    const occurs = t.recurrence ? occursOn(t, today) : t.due_date === today;
    if (!occurs) continue;
    notes.push({
      user_id: t.user_id,
      title: t.title,
      body: `Due now · ${formatTime(t.due_time)}${t.category ? ` · ${t.category}` : ""}`,
      tag: `due-${t.id}-${today}`,
    });
  }

  // ---- interval reminders on their cadence ----
  const { data: intervals } = await db.from("tasks")
    .select("*")
    .eq("recurrence", "interval")
    .eq("task_type", "individual");
  for (const t of (intervals ?? []) as Row[]) {
    if (!t.window_start || !t.window_end || !t.repeat_every_min) continue;
    if (isQuietToday(t, today)) continue;
    const ws = toMin(t.window_start), we = toMin(t.window_end);
    if (nowMin < ws || nowMin > we) continue;
    if ((nowMin - ws) % t.repeat_every_min !== 0) continue;
    notes.push({
      user_id: t.user_id,
      title: t.title,
      body: `Time for this · every ${t.repeat_every_min % 60 === 0 ? `${t.repeat_every_min / 60} hr` : `${t.repeat_every_min} min`}`,
      tag: `interval-${t.id}-${today}-${hhmm}`,
    });
  }

  // ---- snoozed tasks waking up this minute ----
  const nowIso = new Date().toISOString();
  const minuteAgoIso = new Date(Date.now() - 60_000).toISOString();
  const { data: waking } = await db.from("tasks")
    .select("*")
    .gt("snoozed_until", minuteAgoIso)
    .lte("snoozed_until", nowIso)
    .eq("task_type", "individual");
  for (const t of (waking ?? []) as Row[]) {
    const doneToday = t.recurrence ? t.last_done_on === today : t.is_done;
    if (doneToday) continue;
    notes.push({
      user_id: t.user_id,
      title: "Back on your plate",
      body: t.title,
      tag: `wake-${t.id}`,
    });
  }

  // ---- morning brief at 08:00 IST ----
  if (hhmm === "08:00") {
    const { data: all } = await db.from("tasks")
      .select("*")
      .eq("task_type", "individual")
      .eq("is_done", false);
    const byUser = new Map<string, Row[]>();
    for (const t of (all ?? []) as Row[]) {
      if (!byUser.has(t.user_id)) byUser.set(t.user_id, []);
      byUser.get(t.user_id)!.push(t);
    }
    for (const [userId, rows] of byUser) {
      const due = rows.filter((t) => !isQuietToday(t, today) && (
        t.recurrence ? t.recurrence !== "interval" && occursOn(t, today) : t.due_date === today
      ));
      const overdue = rows.filter((t) => !t.recurrence && !!t.due_date && t.due_date < today && !t.skipped_on);
      if (due.length + overdue.length === 0) continue;
      const firstTimed = due.filter((t) => t.due_time).sort((a, b) => (a.due_time! < b.due_time! ? -1 : 1))[0];
      const parts = [`${due.length} task${due.length === 1 ? "" : "s"} today`];
      if (firstTimed) parts.push(`first at ${formatTime(firstTimed.due_time)}`);
      if (overdue.length) parts.push(`${overdue.length} overdue`);
      notes.push({
        user_id: userId,
        title: "Your day ahead",
        body: parts.join(" · "),
        tag: `brief-${today}`,
      });
    }
  }

  if (notes.length === 0) return NextResponse.json({ sent: 0 });

  // ---- deliver to every registered device of each user ----
  const userIds = Array.from(new Set(notes.map((n) => n.user_id)));
  const { data: subs } = await db.from("push_subscriptions")
    .select("endpoint, user_id, p256dh, auth")
    .in("user_id", userIds);

  let sent = 0;
  const dead: string[] = [];
  await Promise.allSettled((subs ?? []).flatMap((s) =>
    notes.filter((n) => n.user_id === s.user_id).map(async (n) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ title: n.title, body: n.body, tag: n.tag, url: "/tasks" }),
        );
        sent++;
      } catch (e: unknown) {
        const code = (e as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) dead.push(s.endpoint);   // device gone
      }
    })
  ));
  if (dead.length) await db.from("push_subscriptions").delete().in("endpoint", dead);

  return NextResponse.json({ sent, cleaned: dead.length });
}

export async function POST(request: Request) { return handle(request); }
export async function GET(request: Request) { return handle(request); }
