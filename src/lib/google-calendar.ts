"use client";

// Read-only Google Calendar sync via Google Identity Services (token flow).
// Needs NEXT_PUBLIC_GOOGLE_CLIENT_ID (a Google Cloud OAuth "Web application"
// client ID with the Calendar API enabled). Without it the connect UI hides.

export interface GoogleEvent {
  id: string;
  title: string;
  date: string;        // YYYY-MM-DD (local date of start)
  time?: string;       // "h:mm AM/PM" when the event has a time
  endTime?: string;
  calendarName: string;
  color?: string;
  startMs: number;
}

// readonly: list calendars + read events; events: create/delete events we push
const SCOPE = "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events";
const STORAGE_KEY = "gcal_token";
const GSI_SRC = "https://accounts.google.com/gsi/client";

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

interface StoredToken { token: string; expiresAt: number; }

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global { interface Window { google?: any } }

function getStoredToken(): string | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: StoredToken = JSON.parse(raw);
    return parsed.expiresAt > Date.now() + 60_000 ? parsed.token : null;
  } catch { return null; }
}

export function hasGoogleToken(): boolean {
  return getStoredToken() !== null;
}

const LINKED_KEY = "gcal_linked";

/** True when we hold a live token OR the account has a server-side refresh token. */
export function isGoogleConnected(): boolean {
  if (hasGoogleToken()) return true;
  try { return localStorage.getItem(LINKED_KEY) === "1"; } catch { return false; }
}

function markLinked(linked: boolean): void {
  try {
    if (linked) localStorage.setItem(LINKED_KEY, "1");
    else localStorage.removeItem(LINKED_KEY);
  } catch { /* ignore */ }
}

function storeToken(token: string, expiresInSec: number): void {
  const stored: StoredToken = { token, expiresAt: Date.now() + Math.max(60, expiresInSec - 120) * 1000 };
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored)); } catch { /* ignore */ }
  markLinked(true);
}

/**
 * Returns a usable access token: the stored one if still valid, otherwise a
 * fresh one minted server-side from the user's refresh token. Null when the
 * account isn't linked (or refresh is unavailable).
 */
export async function getAccessToken(): Promise<string | null> {
  const stored = getStoredToken();
  if (stored) return stored;
  try {
    const res = await fetch("/api/google-token");
    if (res.status === 404) { markLinked(false); return null; }
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data?.access_token !== "string") return null;
    storeToken(data.access_token, Number(data.expires_in) || 3600);
    return data.access_token;
  } catch { return null; }
}

/**
 * Picks up a Google access token forwarded by /auth/callback in the URL hash
 * after "Continue with Google" login, stores it, and cleans the URL.
 * Returns true if a token was adopted.
 */
export function adoptTokenFromUrlHash(): boolean {
  try {
    const hash = window.location.hash;
    if (!hash.includes("gcal_token=")) return false;
    const params = new URLSearchParams(hash.slice(1));
    const token = params.get("gcal_token");
    const exp = Number(params.get("gcal_exp"));
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    if (!token) return false;
    const stored: StoredToken = { token, expiresAt: Number.isFinite(exp) && exp > Date.now() ? exp : Date.now() + 3500_000 };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    markLinked(true);
    return true;
  } catch { return false; }
}

export function disconnectGoogle(): void {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  markLinked(false);
  // best-effort: forget the server-side refresh token too
  void fetch("/api/google-token", { method: "DELETE" }).catch(() => { /* ignore */ });
}

function loadGsi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const existing = document.querySelector(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google sign-in")));
      return;
    }
    const s = document.createElement("script");
    s.src = GSI_SRC; s.async = true; s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google sign-in"));
    document.head.appendChild(s);
  });
}

/** Prompts the Google consent popup and stores the granted token for the session. */
export async function connectGoogle(): Promise<string> {
  if (!GOOGLE_CLIENT_ID) throw new Error("Google client ID is not configured");
  await loadGsi();
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPE,
      callback: (resp: { access_token?: string; expires_in?: number; error?: string }) => {
        if (resp.error || !resp.access_token) return reject(new Error(resp.error ?? "No token granted"));
        storeToken(resp.access_token, resp.expires_in ?? 3600);
        resolve(resp.access_token);
      },
    });
    client.requestAccessToken();
  });
}

async function gFetch(url: string, token: string): Promise<any> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 401) { disconnectGoogle(); throw new Error("Google session expired — reconnect"); }
  if (!res.ok) throw new Error(`Google API error ${res.status}`);
  return res.json();
}

function toLocalDate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(d);
}

function toLocalTime(d: Date): string {
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
}

function addMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = (h * 60 + m + mins) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function nextDay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

/**
 * Creates an event on the user's primary calendar for a task.
 * Timed tasks become 30-minute events; dateless times are all-day.
 * Returns the created Google event id.
 */
export async function createGoogleEvent(opts: {
  title: string; date: string; time?: string | null; description?: string | null;
}): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not connected to Google");

  const body = opts.time
    ? {
        summary: opts.title,
        description: opts.description ?? undefined,
        start: { dateTime: `${opts.date}T${opts.time.slice(0, 5)}:00`, timeZone: "Asia/Kolkata" },
        end: { dateTime: `${opts.date}T${addMinutes(opts.time.slice(0, 5), 30)}:00`, timeZone: "Asia/Kolkata" },
      }
    : {
        summary: opts.title,
        description: opts.description ?? undefined,
        start: { date: opts.date },
        end: { date: nextDay(opts.date) },
      };

  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 401 || res.status === 403) { throw new Error("Google session lacks write access — reconnect"); }
  if (!res.ok) throw new Error(`Google API error ${res.status}`);
  const data = await res.json();
  return data.id as string;
}

/** Best-effort delete of a pushed event from the primary calendar. */
export async function deleteGoogleEvent(eventId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) return;
  try {
    await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch { /* task deletion should not fail because of Google */ }
}

/** Fetches events across all the user's calendars for the given window. */
export async function fetchGoogleEvents(timeMin: Date, timeMax: Date): Promise<GoogleEvent[]> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not connected to Google");

  const list = await gFetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", token);
  const calendars: { id: string; summary: string; backgroundColor?: string }[] = list.items ?? [];

  const results = await Promise.allSettled(calendars.map(async (cal) => {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events` +
      `?timeMin=${encodeURIComponent(timeMin.toISOString())}&timeMax=${encodeURIComponent(timeMax.toISOString())}` +
      `&singleEvents=true&orderBy=startTime&maxResults=100`;
    const data = await gFetch(url, token);
    return (data.items ?? [])
      .filter((e: any) => e.status !== "cancelled")
      .map((e: any): GoogleEvent => {
        const startStr: string | undefined = e.start?.dateTime ?? e.start?.date;
        const allDay = !e.start?.dateTime;
        const start = startStr ? new Date(startStr) : new Date();
        return {
          id: `${cal.id}:${e.id}`,
          title: e.summary || "(No title)",
          date: allDay ? (e.start?.date ?? toLocalDate(start)) : toLocalDate(start),
          time: allDay ? undefined : toLocalTime(start),
          endTime: e.end?.dateTime ? toLocalTime(new Date(e.end.dateTime)) : undefined,
          calendarName: cal.summary,
          color: cal.backgroundColor,
          startMs: start.getTime(),
        };
      });
  }));

  const events = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  events.sort((a, b) => a.startMs - b.startMs);
  return events;
}
