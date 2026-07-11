"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Auth shell matching the homepage: light gray ground, floating white card,
 * text-only wordmark, quiet footer. Shared by login, signup, and the
 * password-reset pages.
 */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-[#EEF1F4] text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50">
      <header className="flex justify-center pt-10">
        <Link href="/" className="font-heading text-xl font-semibold tracking-tight">
          TaskTeam<span className="text-emerald-600 dark:text-emerald-400">Pro</span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-7 shadow-sm shadow-black/5 sm:p-9 dark:border-white/5 dark:bg-neutral-900">
          {children}
        </motion.div>
      </main>

      <footer className="flex items-center justify-center gap-4 pb-8 text-[12px] text-neutral-500 dark:text-neutral-400">
        <span>© {new Date().getFullYear()} TaskTeamPro</span>
        <Link href="/privacy" className="transition-colors hover:text-neutral-950 dark:hover:text-white">Privacy</Link>
        <Link href="/terms" className="transition-colors hover:text-neutral-950 dark:hover:text-white">Terms</Link>
      </footer>
    </div>
  );
}
