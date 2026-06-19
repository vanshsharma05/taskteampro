import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import StaffView from "./StaffView";

export default async function StaffPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("company_id, role").eq("id", user.id).maybeSingle();

  if (!profile?.company_id) redirect("/onboarding");

  const { data: tasks } = await supabase
    .from("tasks").select("*")
    .eq("user_id", user.id)
    .eq("company_id", profile.company_id)
    .order("due_date", { ascending: true });

  return <StaffView userEmail={user.email ?? ""} initialTasks={tasks ?? []} />;
}
