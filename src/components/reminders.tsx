"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { istToday, occursOn, isCheckedOn, formatTime, type PersonalTask } from "@/lib/personal";

function istHHMM(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${h === "24" ? "00" : h}:${m}`;
}
const toMin = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };

function initialPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export function Reminders({ tasks }: { tasks: PersonalTask[] }) {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">(initialPermission);
  const [dismissed, setDismissed] = useState(false);
  const tasksRef = useRef(tasks);
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    if (perm !== "granted") return;
    const tick = () => {
      const today = istToday();
      const now = istHHMM();
      const nowMin = toMin(now);

      const fire = (t: PersonalTask, sub: string) => {
        const key = `${t.id}:${today}:${now}`;
        if (firedRef.current.has(key)) return;
        firedRef.current.add(key);
        try {
          const n = new Notification(t.title, {
            body: `Reminder · ${sub}${t.category ? ` · ${t.category}` : ""}`, tag: key,
          });
          n.onclick = () => { window.focus(); n.close(); };
        } catch { /* ignore */ }
      };

      for (const t of tasksRef.current) {
        if (t.recurrence === "interval") {
          if (!t.window_start || !t.window_end || !t.repeat_every_min) continue;
          const ws = toMin(t.window_start), we = toMin(t.window_end);
          if (nowMin < ws || nowMin > we) continue;
          if ((nowMin - ws) % t.repeat_every_min !== 0) continue;
          fire(t, "time for this");
        } else {
          if (!t.due_time) continue;
          if (t.due_time.slice(0, 5) !== now) continue;
          if (!occursOn(t, today)) continue;
          if (isCheckedOn(t, today)) continue;
          fire(t, formatTime(t.due_time));
        }
      }
    };
    tick();
    const id = window.setInterval(tick, 20000);
    return () => window.clearInterval(id);
  }, [perm]);

  async function enable() {
    if (perm === "unsupported") return;
    const res = await Notification.requestPermission();
    setPerm(res);
    if (res === "granted") {
      try { new Notification("Reminders are on", { body: "We'll nudge you when something's due." }); } catch { /* ignore */ }
    }
  }

  if (perm === "granted" || perm === "unsupported" || dismissed) return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-indigo-600 dark:text-indigo-400">
        <Bell className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Turn on reminders</p>
        <p className="text-xs text-muted-foreground">
          {perm === "denied" ? "Reminders are blocked — enable notifications for this site in your browser settings."
            : "Get a nudge when a task is due, or on your repeating reminders."}
        </p>
      </div>
      {perm === "default" && (
        <button onClick={enable} className="shrink-0 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition hover:bg-foreground/90">Turn on</button>
      )}
      <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="shrink-0 rounded-md p-1 text-muted-foreground/60 transition hover:text-foreground">
        <X className="size-4" />
      </button>
    </div>
  );
}
