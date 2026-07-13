"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Crown, Link2, Share2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { scoreTasks, isDoneNow, type ScoringTask } from "@/lib/scoring";
import { EASE, JADE_BTN, Ring, Reveal, Panel, Press, scoreTone } from "@/components/work-kit";
import { cn } from "@/lib/utils";

type Member = { id: string; email: string | null; role: string | null };

function initials(email: string | null) { return (email ?? "?").slice(0, 2).toUpperCase(); }

export default function TeamView({ userEmail, companyName, joinCode, adminId, members, tasks }: {
  userEmail: string; companyName: string; joinCode: string; adminId: string;
  members: Member[]; tasks: ScoringTask[];
}) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const now = new Date();

  const stats = useMemo(() => {
    const m = new Map<string, { score: number | null; open: number }>();
    for (const mem of members) {
      const mine = tasks.filter((t) => t.user_id === mem.id);
      m.set(mem.id, { score: scoreTasks(mine, now).score, open: mine.filter((t) => !isDoneNow(t, now)).length });
    }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, tasks]);

  const joinLink = typeof window !== "undefined" ? `${window.location.origin}/signup?code=${joinCode}` : "";

  async function copy(kind: "code" | "link") {
    await navigator.clipboard.writeText(kind === "code" ? joinCode : joinLink);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1600);
  }

  const teamCount = members.filter((m) => m.id !== adminId).length;

  return (
    <AppShell role="admin" userEmail={userEmail} title="Team">
      <div className="mx-auto w-full max-w-3xl space-y-5 pb-20">
        {/* header */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">{companyName}</p>
          <h2 className="mt-1 font-heading text-3xl font-bold tracking-tight">Your team</h2>
        </motion.div>

        {/* invite hero */}
        <Reveal>
          <Panel className="border-transparent">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#3D9E77] to-[#2E7D5E] px-6 py-6 text-white">
              <div className="pointer-events-none absolute -right-6 -top-8 size-36 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex items-center gap-2">
                <Share2 className="size-4" />
                <p className="text-[12px] font-semibold uppercase tracking-wider text-white/80">Invite people</p>
              </div>
              <p className="relative mt-1 text-sm text-white/85">Share the code or link — new members join your workspace instantly.</p>

              <div className="relative mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Join code</p>
                  <motion.p initial={{ letterSpacing: "0.1em", opacity: 0 }} animate={{ letterSpacing: "0.28em", opacity: 1 }}
                    transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
                    className="mt-1 font-heading text-3xl font-bold tabular-nums sm:text-4xl">{joinCode}</motion.p>
                </div>
                <div className="flex gap-2">
                  <Press onClick={() => copy("code")}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-white/15 px-4 text-sm font-semibold backdrop-blur transition-colors hover:bg-white/25">
                    {copied === "code" ? <><Check className="size-4" /> Copied</> : <><Copy className="size-4" /> Code</>}
                  </Press>
                  <Press onClick={() => copy("link")}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-[#2E7D5E] shadow-sm transition-colors hover:bg-white/90">
                    {copied === "link" ? <><Check className="size-4" /> Copied</> : <><Link2 className="size-4" /> Copy link</>}
                  </Press>
                </div>
              </div>
            </div>
          </Panel>
        </Reveal>

        {/* roster */}
        <Reveal i={1}>
          <Panel>
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <h3 className="font-heading text-sm font-bold uppercase tracking-wide">Members</h3>
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
                {teamCount} + you
              </span>
            </div>
            <ul className="divide-y divide-border">
              {members.map((m, i) => {
                const isAdmin = m.id === adminId;
                const st = stats.get(m.id);
                return (
                  <motion.li key={m.id}
                    initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                    transition={{ duration: 0.4, ease: EASE, delay: i * 0.05 }}
                    className="flex items-center gap-3 px-5 py-3.5">
                    <span className={cn("grid size-10 shrink-0 place-items-center rounded-full text-xs font-semibold",
                      isAdmin ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" : "bg-accent text-accent-foreground")}>
                      {initials(m.email)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                        {m.email ?? "Unknown"}
                        {isAdmin && <Crown className="size-3.5 shrink-0 text-amber-500" />}
                      </p>
                      <p className="text-[12px] text-muted-foreground">
                        {isAdmin ? "Admin · owns this workspace" : st ? `${st.open} open · ${scoreTone(st.score).label.toLowerCase()}` : "Member"}
                      </p>
                    </div>
                    {!isAdmin && st && <Ring score={st.score} size={44} />}
                  </motion.li>
                );
              })}
            </ul>
          </Panel>
        </Reveal>

        <p className="px-1 text-xs text-muted-foreground">
          The ring shows each member&rsquo;s on-time reliability. Assign and rebalance their work from the Dashboard.
        </p>
      </div>
    </AppShell>
  );
}
