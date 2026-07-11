import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

// Kicks off the calendar-connect OAuth flow (separate from login, which
// requests no sensitive scopes). access_type=offline + prompt=consent make
// Google issue a refresh token so sync survives past the first hour.

const SCOPES = "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return NextResponse.redirect(new URL("/tasks?gcal_error=config", url.origin));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", url.origin));

  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("g_oauth_state", state, {
    httpOnly: true, secure: url.protocol === "https:", sameSite: "lax", maxAge: 600, path: "/",
  });

  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.searchParams.set("client_id", clientId);
  auth.searchParams.set("redirect_uri", `${url.origin}/api/google-oauth/callback`);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("scope", SCOPES);
  auth.searchParams.set("access_type", "offline");
  auth.searchParams.set("prompt", "consent");
  auth.searchParams.set("state", state);
  return NextResponse.redirect(auth);
}
