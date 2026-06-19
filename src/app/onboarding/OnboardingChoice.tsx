"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { User, Building2, Users, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type Choice = "individual" | "create" | "join";

const ROUTES: Record<Choice, string> = {
  individual: "/tasks",
  create: "/company/new",
  join: "/join",
};

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 26 } },
};

export default function OnboardingChoice({ userId }: { userId: string }) {
  const [saving, setSaving] = useState<Choice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleChoice(choice: Choice) {
    setSaving(choice);
    setError(null);

    const profileData =
      choice === "individual"
        ? { id: userId, account_type: "individual" }
        : {
            id: userId,
            account_type: "business",
            role: choice === "create" ? "admin" : "member",
          };

    const supabase = createClient();
    const { error } = await supabase.from("profiles").upsert(profileData as { id: string; account_type: string; role?: string });

    if (error) {
      setError(error.message);
      setSaving(null);
      return;
    }

    router.push(ROUTES[choice]);
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-12 text-center">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-80 w-[680px] -translate-x-1/2 rounded-full bg-indigo-500/[0.07] blur-3xl" />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 26 }} className="relative">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-foreground font-heading text-base font-bold text-background shadow-sm">T</div>
          <span className="font-heading text-lg font-bold tracking-tight text-foreground">TeamTaskPro</span>
        </Link>
      </motion.div>

      <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 26, delay: 0.05 }}
        className="relative font-heading text-3xl font-bold tracking-tight text-foreground">
        How will you use TeamTaskPro?
      </motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }} className="relative mt-2 text-lg text-muted-foreground">
        Pick the option that fits you best.
      </motion.p>

      <motion.div variants={container} initial="hidden" animate="show" className="relative mt-10 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
        <ChoiceCard icon={User} title="Just me" subtitle="Personal tasks and reminders" loading={saving === "individual"} disabled={saving !== null} onClick={() => handleChoice("individual")} />
        <ChoiceCard icon={Building2} title="Set up my company" subtitle="I'm the owner or admin" loading={saving === "create"} disabled={saving !== null} onClick={() => handleChoice("create")} />
        <ChoiceCard icon={Users} title="Join my team" subtitle="My company is already on TeamTaskPro" loading={saving === "join"} disabled={saving !== null} onClick={() => handleChoice("join")} />
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="relative mt-6 w-full max-w-sm text-left">
            <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChoiceCard({ icon: Icon, title, subtitle, loading, disabled, onClick }: {
  icon: typeof User; title: string; subtitle: string; loading: boolean; disabled: boolean; onClick: () => void;
}) {
  return (
    <motion.div variants={item}>
      <Card
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={disabled ? undefined : onClick}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onClick(); }
        }}
        className={cn(
          "group relative flex h-full flex-col items-center gap-3 overflow-hidden px-6 py-10 text-center shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          disabled ? (loading ? "" : "pointer-events-none opacity-50") : "cursor-pointer hover:-translate-y-1 hover:border-foreground/20 hover:shadow-lg"
        )}
      >
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-indigo-600 transition-transform group-hover:scale-105 dark:text-indigo-400">
          {loading ? <Loader2 className="size-6 animate-spin" /> : <Icon className="size-6" />}
        </div>
        <div>
          <p className="font-heading text-lg font-bold tracking-tight text-foreground">{title}</p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</p>
        </div>
      </Card>
    </motion.div>
  );
}
