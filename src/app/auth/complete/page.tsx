"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { adoptTokenFromUrlHash } from "@/lib/google-calendar";

// Post-login landing: stores the Google Calendar token from the URL hash
// before any further redirects can drop it, then continues into the app.
export default function AuthCompletePage() {
  const router = useRouter();

  useEffect(() => {
    adoptTokenFromUrlHash();
    const next = new URLSearchParams(window.location.search).get("next") ?? "/onboarding";
    router.replace(next.startsWith("/") ? next : "/onboarding");
  }, [router]);

  return (
    <div className="grid min-h-screen place-items-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      </div>
    </div>
  );
}
