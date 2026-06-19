import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import JoinForm from "./JoinForm";

export default async function JoinPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <JoinForm />;
}
