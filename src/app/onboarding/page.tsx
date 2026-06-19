import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import OnboardingChoice from "./OnboardingChoice";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type, company_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.account_type === "individual") {
    redirect("/tasks");
  }

  if (profile?.account_type === "business") {
    if (profile.company_id) {
      redirect(profile.role === "member" ? "/staff" : "/admin");
    }
    redirect(profile.role === "member" ? "/join" : "/company/new");
  }

  return <OnboardingChoice userId={user.id} />;
}
