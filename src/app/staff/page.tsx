import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import StaffView from "./StaffView";

export default async function StaffPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // "my company tasks" doesn't need the profile row first — both queries go
  // out in parallel and we validate membership after
  const [{ data: profile }, { data: tasks }] = await Promise.all([
    supabase.from("profiles").select("company_id, role").eq("id", user.id).maybeSingle(),
    supabase.from("tasks").select("*")
      .eq("user_id", user.id)
      .not("company_id", "is", null)
      .order("due_date", { ascending: true }),
  ]);

  if (!profile?.company_id) redirect("/onboarding");

  return <StaffView userEmail={user.email ?? ""} initialTasks={tasks ?? []} />;
}
