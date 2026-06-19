"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 26 } },
};

export default function JoinForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("join_company", { code });
    setLoading(false);
    if (error) {
      setError(error.message.includes("Invalid") ? "That code didn't match any company. Check it and try again." : error.message);
      return;
    }
    router.push("/staff");
    router.refresh();
  }

  return (
    <AuthLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.05 }}>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Join your company</h1>
        <p className="mt-1.5 text-muted-foreground">Enter the code your admin shared with you.</p>

        <form onSubmit={handleJoin} className="mt-8">
          <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-4">
            <motion.div variants={item} className="grid gap-1.5">
              <Label htmlFor="code">Company code</Label>
              <Input id="code" required autoFocus value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="7K2P9X" className="text-center font-mono text-base tracking-[0.3em]" />
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div key="error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
                  <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={item} className="mt-1">
              <Button type="submit" disabled={loading || code.trim().length === 0} className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90">{loading ? "Joining..." : "Join company"}</Button>
            </motion.div>
          </motion.div>
        </form>
      </motion.div>
    </AuthLayout>
  );
}
