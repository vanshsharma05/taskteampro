import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import TaskBoard from "./TaskBoard";

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, description, due_date, due_time, importance, status, category, is_done, completed_at")
    .eq("user_id", user.id)
    .is("company_id", null)
    .order("created_at", { ascending: false });

  return <TaskBoard userId={user.id} userEmail={user.email ?? ""} initialTasks={tasks ?? []} />;
}
