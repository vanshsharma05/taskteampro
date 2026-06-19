"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CalendarClock, Repeat, UserPlus, Sparkles, Link2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { AppShell } from "@/components/app-shell";
import { PriorityBadge } from "@/components/task-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Importance = "normal" | "high";
type TaskType = "special" | "cyclic";
type Recurrence = "daily" | "weekly" | "monthly" | "yearly";
type AssignedTask = {
  id: string; user_id: string; title: string; due_date: string; due_time: string;
  importance: Importance; is_done: boolean; task_type: string; recurrence: Recurrence | null;
  blocked_by?: string | null;
};
type Member = { id: string; email: string | null };

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function dueAt(t: AssignedTask) { return new Date(`${t.due_date}T${t.due_time}+05:30`); }
function formatDue(t: AssignedTask) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(dueAt(t));
}
function initialsOf(email: string | null) { return (email ?? "?").slice(0, 2).toUpperCase(); }

const selectClass = "h-10 w-full rounded-[8px] border border-input bg-transparent px-3 text-sm outline-none transition focus:border-foreground/30";

export default function AssignView({ userEmail, companyId, adminId, members, initialTasks }: {
  userEmail: string; companyId: string; adminId: string; members: Member[]; initialTasks: AssignedTask[];
}) {
  const [tasks, setTasks] = useState<AssignedTask[]>(initialTasks);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [assignee, setAssignee] = useState(members[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("special");
  const [recurrence, setRecurrence] = useState<Recurrence>("daily");
  const [dueDate, setDueDate] = useState(todayStr());
  const [dueTime, setDueTime] = useState("17:00");
  const [importance, setImportance] = useState<Importance>("normal");
  const [blockedBy, setBlockedBy] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailById = new Map(members.map((m) => [m.id, m.email]));
  const titleById = new Map(tasks.map((t) => [t.id, t.title]));
  const noMembers = members.length === 0;

  function resetForm() {
    setAssignee(members[0]?.id ?? "");
    setTitle(""); setTaskType("special"); setRecurrence("daily");
    setDueDate(todayStr()); setDueTime("17:00"); setImportance("normal");
    setBlockedBy(""); setError(null);
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!assignee) { setError("Pick a team member to assign to."); return; }
    setSaving(true); setError(null);
    const payload = {
      user_id: assignee, assigned_by: adminId, company_id: companyId, title, importance,
      task_type: taskType,
      due_date: taskType === "cyclic" ? todayStr() : dueDate,
      due_time: dueTime,
      recurrence: taskType === "cyclic" ? recurrence : null,
      blocked_by: blockedBy || null,
    };
    const supabase = createClient();
    const { data, error } = await supabase.from("tasks").insert(payload).select().single();
    setSaving(false);
    if (error) { setError(error.message); return; }
    setTasks((prev) => [data as AssignedTask, ...prev]);
    setOpen(false); resetForm();
  }

  const filtered = tasks.filter((t) => filter === "all" ? true : filter === "done" ? t.is_done : !t.is_done);

  return (
    <AppShell
      role="admin"
      userEmail={userEmail}
      title="Assign tasks"
      primaryAction={
        <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) resetForm(); }}>
          <DialogTrigger render={<Button size="sm" disabled={noMembers} className="rounded-full shadow-sm" />}>
            <Plus className="size-4" /> New assignment
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Sparkles className="size-4 text-indigo-500" /> Assign a task</DialogTitle>
              <DialogDescription>Give it to a team member with a deadline or a repeating schedule.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAssign} className="flex flex-col gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="assignee">Assign to</Label>
                <select id="assignee" className={selectClass} value={assignee} onChange={(e) => setAssignee(e.target.value)} required>
                  <option value="" disabled>Select a member</option>
                  {members.map((m) => (<option key={m.id} value={m.id}>{m.email}</option>))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="title">Task</Label>
                <Input id="title" required autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Send daily dispatch report" />
              </div>
              <div className="grid gap-1.5">
                <Label>Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setTaskType("special")} className={cn(
                    "rounded-[8px] border px-3 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.97]",
                    taskType === "special" ? "border-foreground bg-foreground text-background" : "border-input text-muted-foreground hover:border-foreground/40"
                  )}>One-time</button>
                  <button type="button" onClick={() => setTaskType("cyclic")} className={cn(
                    "rounded-[8px] border px-3 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.97]",
                    taskType === "cyclic" ? "border-foreground bg-foreground text-background" : "border-input text-muted-foreground hover:border-foreground/40"
                  )}>Repeating</button>
                </div>
              </div>
              {taskType === "cyclic" ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="recurrence">Repeats</Label>
                    <select id="recurrence" className={selectClass} value={recurrence} onChange={(e) => setRecurrence(e.target.value as Recurrence)}>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="dueTimeC">Due time</Label>
                    <Input id="dueTimeC" type="time" required value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="dueDate">Due date</Label>
                    <Input id="dueDate" type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="dueTime">Due time</Label>
                    <Input id="dueTime" type="time" required value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
                  </div>
                </div>
              )}
              <div className="grid gap-1.5">
                <Label>Priority</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setImportance("normal")} className={cn(
                    "rounded-[8px] border px-3 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.97]",
                    importance === "normal" ? "border-foreground bg-foreground text-background" : "border-input text-muted-foreground hover:border-foreground/40"
                  )}>Normal</button>
                  <button type="button" onClick={() => setImportance("high")} className={cn(
                    "rounded-[8px] border px-3 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.97]",
                    importance === "high" ? "border-red-500 bg-red-500 text-white" : "border-input text-muted-foreground hover:border-red-400"
                  )}>High</button>
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="blockedBy">Waits on <span className="text-muted-foreground">(optional)</span></Label>
                <select id="blockedBy" className={selectClass} value={blockedBy} onChange={(e) => setBlockedBy(e.target.value)}>
                  <option value="">No dependency</option>
                  {tasks.filter((t) => !t.is_done).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}{emailById.get(t.user_id) ? ` — ${emailById.get(t.user_id)}` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[12px] text-muted-foreground">Stays blocked until the task it waits on is marked done.</p>
              </div>
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              <DialogFooter>
                <Button type="submit" disabled={saving} className="rounded-full">{saving ? "Assigning..." : "Assign task"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }>
      <div className="mx-auto w-full max-w-3xl space-y-5">
        {!noMembers && tasks.length > 0 && (
          <div className="flex items-center gap-2">
            {(["all", "active", "done"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-150 active:scale-95",
                filter === f ? "bg-foreground text-background" : "border border-border text-muted-foreground hover:border-foreground/30"
              )}>
                {f === "all" ? "All" : f === "active" ? "Active" : "Done"}
              </button>
            ))}
          </div>
        )}

        {noMembers ? (
          <Card className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm">
              <UserPlus className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="font-heading text-lg font-bold">No team members yet</p>
              <p className="mx-auto max-w-xs text-sm text-muted-foreground">Add people on the Team page first, then come back to assign them work.</p>
            </div>
          </Card>
        ) : tasks.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm">
              <Plus className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="font-heading text-lg font-bold">No tasks assigned yet</p>
              <p className="mx-auto max-w-xs text-sm text-muted-foreground">Use &ldquo;New assignment&rdquo; to give your first task to the team.</p>
            </div>
          </Card>
        ) : (
          <ul className="flex flex-col gap-2.5">
            <AnimatePresence mode="popLayout">
              {filtered.map((t, i) => (
                <motion.li key={t.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.25, delay: 0.02 * i }}>
                  <AssignedRow
                    task={t}
                    assigneeEmail={emailById.get(t.user_id) ?? null}
                    blockerTitle={t.blocked_by ? (titleById.get(t.blocked_by) ?? null) : null}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </AppShell>
  );
}

function AssignedRow({ task, assigneeEmail, blockerTitle }: { task: AssignedTask; assigneeEmail: string | null; blockerTitle: string | null }) {
  const isCyclic = task.task_type === "cyclic";
  const overdue = !task.is_done && !isCyclic && dueAt(task) < new Date();
  return (
    <motion.div whileHover={{ y: -2 }}>
      <Card className="flex flex-row items-center gap-3 px-4 py-3.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
          {initialsOf(assigneeEmail)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{task.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
            <span className="truncate">{assigneeEmail ?? "Unknown"}</span>
            <span>·</span>
            {isCyclic ? (
              <span className="inline-flex items-center gap-1"><Repeat className="size-3.5" /><span className="capitalize">{task.recurrence}</span> at {task.due_time.slice(0, 5)}</span>
            ) : (
              <span className="inline-flex items-center gap-1"><CalendarClock className="size-3.5" />{formatDue(task)}</span>
            )}
            {blockerTitle && (
              <>
                <span>·</span>
                <span className="inline-flex min-w-0 items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Link2 className="size-3.5 shrink-0" /> <span className="truncate">waits on {blockerTitle}</span>
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge variant="secondary" className="rounded-full">{isCyclic ? "Repeating" : "One-time"}</Badge>
          <PriorityBadge importance={task.importance} />
          {task.is_done ? (
            <Badge className="rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">Done</Badge>
          ) : overdue ? (
            <Badge className="rounded-full bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400">Overdue</Badge>
          ) : null}
        </div>
      </Card>
    </motion.div>
  );
}
