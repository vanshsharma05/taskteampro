"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { MailCheck } from "lucide-react";
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

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      // email confirmation is off → already signed in, go straight in
      router.push("/onboarding");
      router.refresh();
      return;
    }

    // email confirmation is on → show a clear "check your email" screen
    setSent(true);
    setLoading(false);
  }

  return (
    <AuthLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.05 }}>
        {sent ? (
          <div>
            <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <MailCheck className="size-6" />
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight">Check your email</h1>
            <p className="mt-2 text-muted-foreground">
              We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>. Click it to activate your account, then log in.
            </p>
            <Button nativeButton={false} render={<Link href="/login" />} className="mt-6 w-full rounded-full bg-foreground text-background hover:bg-foreground/90">
              Go to log in
            </Button>
          </div>
        ) : (
          <>
            <AuthModeToggle mode="signup" />
            <h1 className="font-heading text-3xl font-bold tracking-tight">Create your account</h1>
            <p className="mt-1.5 text-muted-foreground">Start tracking your day in a few minutes.</p>

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
                  <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
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
                    {loading ? "Creating account…" : "Sign up"}
                  </Button>
                </motion.div>
              </motion.div>
            </form>
          </>
        )}
      </motion.div>
    </AuthLayout>
  );
}
