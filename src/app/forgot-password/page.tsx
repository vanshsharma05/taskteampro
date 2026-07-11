"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MailCheck, ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  }

  return (
    <AuthLayout>
      {sent ? (
        <div>
          <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
            <MailCheck className="size-6" />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Check your email</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            If an account exists for <span className="font-medium text-neutral-950 dark:text-white">{email}</span>,
            we sent a link to reset your password. It expires in an hour.
          </p>
          <Link href="/login"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-800 dark:text-emerald-400">
            <ArrowLeft className="size-4" /> Back to log in
          </Link>
        </div>
      ) : (
        <>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Reset your password</h1>
          <p className="mt-1.5 text-[15px] text-neutral-600 dark:text-neutral-300">
            Enter your email and we&rsquo;ll send you a reset link.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required autoFocus value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div key="error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <Button type="submit" disabled={loading}
              className="min-h-11 w-full rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>

          <Link href="/login"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white">
            <ArrowLeft className="size-4" /> Back to log in
          </Link>
        </>
      )}
    </AuthLayout>
  );
}
