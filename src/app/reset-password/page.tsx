"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

// The reset email lands here (via /auth/callback, which turns the link into
// a signed-in recovery session). No session = expired/invalid link.
export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkOk, setLinkOk] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data: { user } } = await createClient().auth.getUser();
      if (active) setLinkOk(!!user);
    })();
    return () => { active = false; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("The passwords don't match."); return; }
    setLoading(true);
    setError(null);

    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push("/tasks");
    router.refresh();
  }

  return (
    <AuthLayout>
      {linkOk === false ? (
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">This link has expired</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            Reset links only work once and expire after an hour. Request a fresh one and try again.
          </p>
          <Link href="/forgot-password"
            className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700">
            Send a new link
          </Link>
        </div>
      ) : (
        <>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Set a new password</h1>
          <p className="mt-1.5 text-[15px] text-neutral-600 dark:text-neutral-300">
            Choose a new password for your account.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" required minLength={6} autoFocus value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" type="password" required minLength={6} value={confirm}
                onChange={(e) => setConfirm(e.target.value)} placeholder="Same password again" />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div key="error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <Button type="submit" disabled={loading || linkOk === null}
              className="min-h-11 w-full rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
              {loading ? "Saving…" : "Save new password"}
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
