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
      const safeNext = next.startsWith("/") ? next : "/onboarding";

      // keep the refresh token so /api/google-token can mint new access
      // tokens after the 1-hour one from login expires
      const refreshToken = data.session?.provider_refresh_token;
      if (refreshToken && data.session?.user) {
        await supabase.from("google_tokens").upsert({
          user_id: data.session.user.id,
          refresh_token: refreshToken,
          updated_at: new Date().toISOString(),
        });
      }

      const providerToken = data.session?.provider_token;
      if (providerToken) {
        // land on a client page that stores the token BEFORE any further
        // server redirects (which would drop the URL hash)
        const dest = new URL(`/auth/complete?next=${encodeURIComponent(safeNext)}`, url.origin);
        dest.hash = `gcal_token=${encodeURIComponent(providerToken)}&gcal_exp=${Date.now() + 3500_000}`;
        return NextResponse.redirect(dest);
      }
      return NextResponse.redirect(new URL(safeNext, url.origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=google", url.origin));
}
