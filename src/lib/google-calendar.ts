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

const SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
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

export function disconnectGoogle(): void {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
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
        const stored: StoredToken = {
          token: resp.access_token,
          expiresAt: Date.now() + (resp.expires_in ?? 3600) * 1000,
        };
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored)); } catch { /* ignore */ }
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

/** Fetches events across all the user's calendars for the given window. */
export async function fetchGoogleEvents(timeMin: Date, timeMax: Date): Promise<GoogleEvent[]> {
  const token = getStoredToken();
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
