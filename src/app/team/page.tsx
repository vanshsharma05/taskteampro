import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import TeamView from "./TeamView";

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: company } = await supabase
    .from("companies").select("id, name, join_code").eq("admin_id", user.id).maybeSingle();
  if (!company) redirect("/onboarding");

  const { data: members } = await supabase
    .from("profiles").select("id, email, role, created_at")
    .eq("company_id", company.id).order("created_at", { ascending: true });

  return (
    <TeamView
      userEmail={user.email ?? ""}
      companyName={company.name}
      joinCode={company.join_code ?? ""}
      adminId={user.id}
      members={members ?? []}
    />
  );
}
