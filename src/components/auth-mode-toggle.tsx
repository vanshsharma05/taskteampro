import Link from "next/link";
import { cn } from "@/lib/utils";

export function AuthModeToggle({ mode }: { mode: "login" | "signup" }) {
  return (
    <div className="mb-6 inline-flex rounded-full border border-border bg-muted/50 p-1 text-sm font-semibold">
      <Link href="/login" className={cn("rounded-full px-4 py-1.5 transition", mode === "login" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
        Log in
      </Link>
      <Link href="/signup" className={cn("rounded-full px-4 py-1.5 transition", mode === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
        Sign up
      </Link>
    </div>
  );
}
