import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// OAuth landing: exchanges the PKCE code for a session, then forwards the
// Google access token to the client in the URL hash (never sent to servers)
// so the calendar sync can pick it up.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/onboarding";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const dest = new URL(next.startsWith("/") ? next : "/onboarding", url.origin);
      const providerToken = data.session?.provider_token;
      if (providerToken) {
        dest.hash = `gcal_token=${encodeURIComponent(providerToken)}&gcal_exp=${Date.now() + 3500_000}`;
      }
      return NextResponse.redirect(dest);
    }
  }

  return NextResponse.redirect(new URL("/login?error=google", url.origin));
}
