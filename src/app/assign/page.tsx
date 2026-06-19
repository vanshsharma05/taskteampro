import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AssignView from "./AssignView";

export default async function AssignPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: company } = await supabase
    .from("companies").select("id, name").eq("admin_id", user.id).maybeSingle();
  if (!company) redirect("/onboarding");

  const { data: members } = await supabase
    .from("profiles").select("id, email").eq("company_id", company.id).order("created_at");

  const { data: tasks } = await supabase
    .from("tasks").select("*").eq("company_id", company.id).order("created_at", { ascending: false });

  return (
    <AssignView
      userEmail={user.email ?? ""}
      companyId={company.id}
      adminId={user.id}
      members={(members ?? []).filter((m) => m.id !== user.id)}
      initialTasks={tasks ?? []}
    />
  );
}
