"use client";

import { useState } from "react";
import Link from "next/link";
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

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      router.push("/onboarding");
      router.refresh();
      return;
    }

    setMessage("Check your email for a confirmation link, then log in.");
  }

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.05 }}
      >
        <h1 className="font-heading text-3xl font-bold tracking-tight">Create your account</h1>
        <p className="mt-1.5 text-muted-foreground">Start tracking your team in a few minutes.</p>

        <form onSubmit={handleSubmit} className="mt-8">
          <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-4">
            <motion.div variants={item} className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            </motion.div>
            <motion.div variants={item} className="grid gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div key="error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
              {message && (
                <motion.div key="message" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
                  <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                    <AlertDescription className="text-emerald-700 dark:text-emerald-400">{message}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={item} className="mt-1">
              <Button type="submit" disabled={loading} className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90">
                {loading ? "Creating account..." : "Sign up"}
              </Button>
            </motion.div>
          </motion.div>
        </form>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mt-6 text-[13px] text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400">Log in</Link>
        </motion.p>
      </motion.div>
    </AuthLayout>
  );
}
