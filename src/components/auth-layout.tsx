"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

const points = [
  "Assign one-time or recurring tasks in seconds",
  "See on-time reliability for every person",
  "Blockers clear the moment the work is done",
];

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left — brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-neutral-950 p-12 text-white lg:flex xl:p-16">
        <div className="pointer-events-none absolute -right-20 -top-24 size-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-indigo-600/10 blur-3xl" />

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 280, damping: 26 }} className="relative">
          <BrandLogo light size="lg" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 200, damping: 26, delay: 0.1 }} className="relative max-w-md">
          <h2 className="font-heading text-4xl font-bold leading-[1.1] tracking-tight">Know your team&apos;s work is getting done.</h2>
          <p className="mt-4 text-white/55">The simplest way to assign work, track it, and see exactly who&apos;s on top of things.</p>
          <ul className="mt-8 space-y-3">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-white/80">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-400">
                  <Check className="size-3" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </motion.div>

        <p className="relative text-[13px] text-white/40">© {new Date().getFullYear()} TeamTaskPro</p>
      </div>

      {/* Right — form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="mb-8 lg:hidden">
          <BrandLogo size="lg" />
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
