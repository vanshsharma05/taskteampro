"use client";

import { useCallback, useEffect, useState } from "react";
import {
  GOOGLE_CLIENT_ID, connectGoogle, disconnectGoogle, fetchGoogleEvents,
  hasGoogleToken, type GoogleEvent,
} from "@/lib/google-calendar";

/** Google Calendar events from a week back to two months ahead. */
export function useGoogleCalendar() {
  const available = !!GOOGLE_CLIENT_ID;
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [events, setEvents] = useState<GoogleEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const timeMin = new Date(Date.now() - 7 * 86400_000);
      const timeMax = new Date(Date.now() + 60 * 86400_000);
      setEvents(await fetchGoogleEvents(timeMin, timeMax));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load Google Calendar");
      setConnected(hasGoogleToken());
    }
  }, []);

  // resume an existing session token on mount
  useEffect(() => {
    if (!available || !hasGoogleToken()) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setConnected(true);
      void refresh();
    });
    return () => { cancelled = true; };
  }, [available, refresh]);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      await connectGoogle();
      setConnected(true);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect Google Calendar");
    } finally {
      setConnecting(false);
    }
  }, [refresh]);

  const disconnect = useCallback(() => {
    disconnectGoogle();
    setConnected(false);
    setEvents([]);
  }, []);

  return { available, connected, connecting, events, error, connect, disconnect, refresh };
}
