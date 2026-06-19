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

export default function CompanyForm({ userId }: { userId: string }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const supabase = createClient();

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({ name, admin_id: userId })
      .select()
      .single();

    if (companyError) {
      setError(companyError.message);
      setSaving(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ company_id: company.id, role: "admin" })
      .eq("id", userId);

    if (profileError) {
      setError(profileError.message);
      setSaving(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <AuthLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.05 }}>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Create your company</h1>
        <p className="mt-1.5 text-muted-foreground">You&rsquo;ll be set up as the admin for this company.</p>

        <form onSubmit={handleSubmit} className="mt-8">
          <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-4">
            <motion.div variants={item} className="grid gap-1.5">
              <Label htmlFor="companyName">Company name</Label>
              <Input id="companyName" type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Inc." />
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div key="error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
                  <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={item} className="mt-1">
              <Button type="submit" disabled={saving} className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90">{saving ? "Creating..." : "Create company"}</Button>
            </motion.div>
          </motion.div>
        </form>
      </motion.div>
    </AuthLayout>
  );
}
