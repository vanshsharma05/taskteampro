import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The TeamTaskPro mark: "the honest tick" — a checkmark that doubles as
 * clock hands at ten-past-ten, breaking out of the dial. Done + time,
 * one glyph. Keep this SVG in sync with public/icon-*.png (generated
 * from the same geometry).
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={cn("shrink-0", className)} aria-hidden>
      <rect width="512" height="512" rx="116" fill="#0A0A0B" />
      <circle cx="252" cy="262" r="140" fill="none" stroke="#FFFFFF" strokeWidth="26" />
      <circle cx="252" cy="174" r="13" fill="#FFFFFF" />
      {/* halo carves the gap where the tick exits the dial */}
      <path d="M192 208 L248 270 L376 120" fill="none" stroke="#0A0A0B" strokeWidth="78" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M192 208 L248 270 L376 120" fill="none" stroke="#34D399" strokeWidth="38" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Typography lockup: TeamTask in ink, Pro in the brand emerald. */
export function LogoWordmark({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <span className={cn("font-heading font-bold tracking-tight", light ? "text-white" : "text-foreground", className)}>
      TeamTask<span className="text-emerald-500">Pro</span>
    </span>
  );
}

/** Full lockup: mark + wordmark, optionally linked. */
export function BrandLogo({ light = false, href = "/", size = "md", className }: {
  light?: boolean; href?: string | null; size?: "sm" | "md" | "lg"; className?: string;
}) {
  const mark = size === "lg" ? "size-10 rounded-xl" : size === "sm" ? "size-7 rounded-lg" : "size-8 rounded-lg";
  const text = size === "lg" ? "text-xl" : "text-lg";
  const body = (
    <>
      <LogoMark className={cn(mark, "shadow-sm ring-1 ring-white/10")} />
      <LogoWordmark light={light} className={text} />
    </>
  );
  if (href === null) return <span className={cn("flex items-center gap-2.5", className)}>{body}</span>;
  return <Link href={href} className={cn("flex items-center gap-2.5", className)}>{body}</Link>;
}
