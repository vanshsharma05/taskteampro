import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import CompanyForm from "./CompanyForm";

export default async function NewCompanyPage() {
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

  if (!profile || profile.account_type !== "business") {
    redirect("/onboarding");
  }

  if (profile.role === "member") {
    redirect(profile.company_id ? "/staff" : "/join");
  }

  if (profile.company_id) {
    redirect("/admin");
  }

  return <CompanyForm userId={user.id} />;
}
