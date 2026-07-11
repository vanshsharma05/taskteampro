"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adoptTokenFromUrlHash, disconnectGoogle, fetchGoogleEvents,
  getAccessToken, hasGoogleToken, type GoogleEvent,
} from "@/lib/google-calendar";

const CONNECT_ERRORS: Record<string, string> = {
  config: "Google Calendar isn't configured on the server yet.",
  state: "The connection attempt expired — try again.",
  exchange: "Google rejected the connection — try again.",
};

/** Google Calendar events from a week back to two months ahead. */
export function useGoogleCalendar() {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [events, setEvents] = useState<GoogleEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const available = true; // connect UI always offered; the server route validates config

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

  // adopt a token handed over by the connect flow, resume a stored one,
  // or silently mint a fresh one from the server-side refresh token
  useEffect(() => {
    adoptTokenFromUrlHash();

    // surface a connect failure passed back as ?gcal_error=
    const params = new URLSearchParams(window.location.search);
    const connectError = params.get("gcal_error");
    if (connectError) {
      window.history.replaceState(null, "", window.location.pathname);
      queueMicrotask(() => setError(CONNECT_ERRORS[connectError] ?? "Could not connect Google Calendar"));
      return;
    }

    let cancelled = false;
    void (async () => {
      const token = hasGoogleToken() ? "stored" : await getAccessToken();
      if (cancelled || !token) return;
      setConnected(true);
      await refresh();
    })();
    return () => { cancelled = true; };
  }, [refresh]);

  // full-page redirect into the server-side OAuth flow (issues a refresh
  // token, unlike the old in-page popup)
  const connect = useCallback(() => {
    setConnecting(true);
    window.location.href = "/api/google-oauth/start";
  }, []);

  const disconnect = useCallback(() => {
    disconnectGoogle();
    setConnected(false);
    setEvents([]);
  }, []);

  return { available, connected, connecting, events, error, connect, disconnect, refresh };
}
