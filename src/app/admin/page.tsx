import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: company } = await supabase
    .from("companies").select("id, name").eq("admin_id", user.id).maybeSingle();
  if (!company) redirect("/onboarding");

  const { data: members } = await supabase
    .from("profiles").select("id, email").eq("company_id", company.id).neq("id", user.id).order("created_at");

  const { data: tasks } = await supabase
    .from("tasks").select("*").eq("company_id", company.id);

  return (
    <AdminDashboard
      userEmail={user.email ?? ""}
      companyName={company.name}
      members={members ?? []}
      tasks={tasks ?? []}
    />
  );
}
