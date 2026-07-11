import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Mints a fresh Google access token from the user's stored refresh token.
// Needs GOOGLE_CLIENT_SECRET (server-only) alongside NEXT_PUBLIC_GOOGLE_CLIENT_ID.

export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Google refresh is not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: row } = await supabase
    .from("google_tokens").select("refresh_token").eq("user_id", user.id).maybeSingle();
  if (!row?.refresh_token) {
    return NextResponse.json({ error: "Google Calendar is not linked" }, { status: 404 });
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: row.refresh_token,
      grant_type: "refresh_token",
    }),
  }).catch(() => null);

  if (!res) return NextResponse.json({ error: "Google is unreachable" }, { status: 502 });
  if (!res.ok) {
    // invalid_grant = user revoked access; drop the dead token so the UI
    // falls back to showing Connect instead of failing forever
    if (res.status === 400) {
      await supabase.from("google_tokens").delete().eq("user_id", user.id);
      return NextResponse.json({ error: "Google access was revoked — reconnect" }, { status: 404 });
    }
    return NextResponse.json({ error: "Could not refresh Google access" }, { status: 502 });
  }

  const tok = await res.json();
  if (!tok?.access_token) return NextResponse.json({ error: "Could not refresh Google access" }, { status: 502 });
  return NextResponse.json({ access_token: tok.access_token, expires_in: tok.expires_in ?? 3600 });
}

/** Unlink: forget the stored refresh token. */
export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  await supabase.from("google_tokens").delete().eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
