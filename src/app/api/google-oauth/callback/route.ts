import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

// Completes the calendar-connect flow: verifies state, exchanges the code
// server-side, stores the refresh token, and hands the short-lived access
// token to the client via the URL hash (never sent to any server).

export async function GET(request: Request) {
  const url = new URL(request.url);
  const fail = (why: string) => NextResponse.redirect(new URL(`/tasks?gcal_error=${why}`, url.origin));

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const savedState = cookieStore.get("g_oauth_state")?.value;
  cookieStore.delete("g_oauth_state");
  if (!code || !state || !savedState || state !== savedState) return fail("state");

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail("config");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", url.origin));

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${url.origin}/api/google-oauth/callback`,
      grant_type: "authorization_code",
    }),
  }).catch(() => null);
  if (!res?.ok) return fail("exchange");

  const tok = await res.json();
  if (tok?.refresh_token) {
    await supabase.from("google_tokens").upsert({
      user_id: user.id,
      refresh_token: tok.refresh_token,
      updated_at: new Date().toISOString(),
    });
  }

  const dest = new URL("/tasks", url.origin);
  if (tok?.access_token) {
    const expMs = Date.now() + (Number(tok.expires_in) || 3600) * 1000;
    dest.hash = `gcal_token=${encodeURIComponent(tok.access_token)}&gcal_exp=${expMs}`;
  }
  return NextResponse.redirect(dest);
}
