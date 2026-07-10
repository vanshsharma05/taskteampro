import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import TaskBoard from "./TaskBoard";

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tasks } = await supabase
    .from("tasks")
    .select(
      "id, title, description, category, importance, due_date, due_time, recurrence, repeat_days, repeat_dom, repeat_every_min, window_start, window_end, is_done, last_done_on, completed_at, snoozed_until, skipped_on, subtasks",
    )
    .eq("user_id", user.id)
    .is("company_id", null)
    .order("created_at", { ascending: false });

  return <TaskBoard userId={user.id} userEmail={user.email ?? ""} initialTasks={tasks ?? []} />;
}
