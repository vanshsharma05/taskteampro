"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { enablePush, ensurePushRegistered, pushSupported } from "@/lib/push-client";

const DISMISS_KEY = "reminders_banner_dismissed";

/**
 * Notification opt-in banner. Actual reminders are sent server-side via web
 * push (they arrive even with the app closed); this component only handles
 * getting permission and registering the device.
 */
export function Reminders() {
  const [state, setState] = useState<"unknown" | "prompt" | "granted" | "denied" | "unsupported">("unknown");
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try { return localStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
  });

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      if (!pushSupported()) { setState("unsupported"); return; }
      const p = Notification.permission;
      setState(p === "granted" ? "granted" : p === "denied" ? "denied" : "prompt");
      // returning device with permission: keep its registration fresh
      if (p === "granted") void ensurePushRegistered();
    });
    return () => { active = false; };
  }, []);

  async function enable() {
    const result = await enablePush();
    setState(result === "granted" ? "granted" : result === "denied" ? "denied" : "prompt");
    if (result === "granted") {
      // the confirmation *is* the demo: show one local notification
      try {
        const reg = await navigator.serviceWorker.ready;
        void reg.showNotification("Reminders are on", {
          body: "You'll get a nudge when a task is due — even with the app closed.",
          icon: "/icon-192.png",
        });
      } catch { /* ignore */ }
    }
  }

  if (state === "granted" || state === "unsupported" || state === "unknown" || dismissed) return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-indigo-600 dark:text-indigo-400">
        <Bell className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Turn on reminders</p>
        <p className="text-xs text-muted-foreground">
          {state === "denied"
            ? "Notifications are blocked — enable them for this site in your browser settings."
            : "Due-time nudges and a morning brief, even when the app is closed."}
        </p>
      </div>
      {state === "prompt" && (
        <button onClick={enable} className="shrink-0 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition hover:bg-foreground/90">
          Turn on
        </button>
      )}
      <button onClick={() => { setDismissed(true); try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ } }}
        aria-label="Dismiss" className="shrink-0 rounded-md p-1 text-muted-foreground/60 transition hover:text-foreground">
        <X className="size-4" />
      </button>
    </div>
  );
}
