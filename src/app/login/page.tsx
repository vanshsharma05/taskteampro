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
import { AuthModeToggle } from "@/components/auth-mode-toggle";
import { GoogleAuthButton, AuthDivider } from "@/components/google-auth-button";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 26 } },
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // keep the button in its loading state while we navigate away
    router.push("/tasks");
    router.refresh();
  }

  return (
    <AuthLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.05 }}>
        <AuthModeToggle mode="login" />
        <h1 className="font-heading text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-1.5 text-muted-foreground">Log in to your TeamTaskPro account.</p>

        <div className="mt-8">
          <GoogleAuthButton />
          <AuthDivider />
        </div>

        <form onSubmit={handleSubmit}>
          <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-4">
            <motion.div variants={item} className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            </motion.div>
            <motion.div variants={item} className="grid gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div key="error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
                  <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={item} className="mt-1">
              <Button type="submit" disabled={loading} className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90">
                {loading ? "Signing in…" : "Log in"}
              </Button>
            </motion.div>
          </motion.div>
        </form>
      </motion.div>
    </AuthLayout>
  );
}
