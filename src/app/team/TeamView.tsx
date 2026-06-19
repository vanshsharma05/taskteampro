"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Users, Crown } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Member = { id: string; email: string | null; role: string | null };

export default function TeamView({ userEmail, companyName, joinCode, adminId, members }: {
  userEmail: string; companyName: string; joinCode: string; adminId: string; members: Member[];
}) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <AppShell role="admin" userEmail={userEmail} title="Team">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{companyName}</p>
          <h2 className="mt-1 font-heading text-3xl font-bold tracking-tight">Your team</h2>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
          <Card className="overflow-hidden p-0">
            <div className="bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-4 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Invite people</p>
              <p className="mt-1 text-sm opacity-90">Share this code with your team. They&apos;ll enter it when signing up.</p>
            </div>
            <div className="flex flex-col items-center gap-4 px-5 py-6 sm:flex-row sm:justify-between">
              <div className="text-center sm:text-left">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Join code</p>
                <p className="mt-1 font-heading text-3xl font-bold tracking-[0.3em] tabular-nums">{joinCode}</p>
              </div>
              <Button onClick={copyCode} className="rounded-full" variant={copied ? "secondary" : "default"}>
                {copied ? <><Check className="size-4" /> Copied</> : <><Copy className="size-4" /> Copy code</>}
              </Button>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
          <Card className="overflow-hidden p-0">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <Users className="size-4 text-muted-foreground" />
              <h3 className="font-heading text-sm font-bold uppercase tracking-wide">Members</h3>
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">{members.length}</span>
            </div>
            <ul className="divide-y divide-border">
              {members.map((m, i) => {
                const isAdmin = m.id === adminId;
                return (
                  <motion.li key={m.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, delay: 0.05 * i }}
                    className="flex items-center gap-3 px-5 py-3.5">
                    <div className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      isAdmin ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" : "bg-accent text-accent-foreground"
                    )}>
                      {(m.email ?? "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{m.email ?? "Unknown"}</p>
                      <p className="text-[12px] text-muted-foreground">{isAdmin ? "Admin" : "Member"}</p>
                    </div>
                    {isAdmin && <Crown className="size-4 text-amber-500" />}
                  </motion.li>
                );
              })}
            </ul>
          </Card>
        </motion.div>
      </div>
    </AppShell>
  );
}
