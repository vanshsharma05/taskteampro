"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CalendarClock, Repeat, UserPlus, ClipboardList, Link2, Flag } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EASE, JADE_BTN, Reveal, Panel } from "@/components/work-kit";
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
function initials(email: string | null) { return (email ?? "?").slice(0, 2).toUpperCase(); }

const selectClass = "h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm outline-none transition focus:border-[#3D9E77]";
const segBtn = (active: boolean, danger = false) => cn(
  "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-[0.97]",
  active
    ? danger ? "border-red-500 bg-red-500 text-white" : "border-[#3D9E77] bg-[#3D9E77] text-white"
    : "border-input text-muted-foreground hover:border-foreground/40",
);

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

  const emailById = useMemo(() => new Map(members.map((m) => [m.id, m.email])), [members]);
  const titleById = useMemo(() => new Map(tasks.map((t) => [t.id, t.title])), [tasks]);
  const openByMember = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of tasks) if (!t.is_done) m.set(t.user_id, (m.get(t.user_id) ?? 0) + 1);
    return m;
  }, [tasks]);
  const noMembers = members.length === 0;

  const active = tasks.filter((t) => !t.is_done).length;
  const done = tasks.filter((t) => t.is_done).length;

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

  const trigger = (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) resetForm(); }}>
      <DialogTrigger render={
        <button disabled={noMembers}
          className={cn("inline-flex min-h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold shadow-sm transition-all duration-150 active:scale-[0.97] disabled:opacity-40", JADE_BTN)} />
      }>
        <Plus className="size-4" /> New assignment
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ClipboardList className="size-4 text-[#3D9E77]" /> Assign a task</DialogTitle>
          <DialogDescription>Give it to a teammate with a deadline or a repeating schedule.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAssign} className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="assignee">Assign to</Label>
            <select id="assignee" className={selectClass} value={assignee} onChange={(e) => setAssignee(e.target.value)} required>
              <option value="" disabled>Select a member</option>
              {members.map((m) => {
                const load = openByMember.get(m.id) ?? 0;
                return <option key={m.id} value={m.id}>{m.email}{load ? ` · ${load} open` : " · free"}</option>;
              })}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="title">Task</Label>
            <Input id="title" required autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Send daily dispatch report" />
          </div>
          <div className="grid gap-1.5">
            <Label>Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setTaskType("special")} className={segBtn(taskType === "special")}>One-time</button>
              <button type="button" onClick={() => setTaskType("cyclic")} className={segBtn(taskType === "cyclic")}>Repeating</button>
            </div>
          </div>
          {taskType === "cyclic" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="recurrence">Repeats</Label>
                <select id="recurrence" className={selectClass} value={recurrence} onChange={(e) => setRecurrence(e.target.value as Recurrence)}>
                  <option value="daily">Daily</option><option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option><option value="yearly">Yearly</option>
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
              <button type="button" onClick={() => setImportance("normal")} className={segBtn(importance === "normal")}>Normal</button>
              <button type="button" onClick={() => setImportance("high")} className={segBtn(importance === "high", true)}>High</button>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="blockedBy">Waits on <span className="text-muted-foreground">(optional)</span></Label>
            <select id="blockedBy" className={selectClass} value={blockedBy} onChange={(e) => setBlockedBy(e.target.value)}>
              <option value="">No dependency</option>
              {tasks.filter((t) => !t.is_done).map((t) => (
                <option key={t.id} value={t.id}>{t.title}{emailById.get(t.user_id) ? ` — ${emailById.get(t.user_id)}` : ""}</option>
              ))}
            </select>
            <p className="text-[12px] text-muted-foreground">Stays blocked until the task it waits on is marked done.</p>
          </div>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <DialogFooter>
            <Button type="submit" disabled={saving} className={cn("min-h-11 rounded-xl", JADE_BTN)}>{saving ? "Assigning…" : "Assign task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <AppShell role="admin" userEmail={userEmail} title="Assign" primaryAction={trigger}>
      <div className="mx-auto w-full max-w-3xl space-y-5 pb-20">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}
          className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-3xl font-bold tracking-tight">Assignments</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {tasks.length === 0 ? "Give your team their first task." : `${active} active · ${done} done`}
            </p>
          </div>
        </motion.div>

        {!noMembers && tasks.length > 0 && (
          <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
            {(["all", "active", "done"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("relative flex-1 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors",
                  filter === f ? "text-white" : "text-muted-foreground hover:text-foreground")}>
                {filter === f && (
                  <motion.span layoutId="assignFilter" className="absolute inset-0 rounded-lg bg-[#3D9E77]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                )}
                <span className="relative">{f === "all" ? "All" : f === "active" ? "Active" : "Done"}</span>
              </button>
            ))}
          </div>
        )}

        {noMembers ? (
          <EmptyState icon={UserPlus} title="No team members yet" body="Add people on the Team page first, then come back to assign them work." />
        ) : tasks.length === 0 ? (
          <EmptyState icon={Plus} title="No tasks assigned yet" body="Use “New assignment” to give your first task to the team." />
        ) : (
          <ul className="flex flex-col gap-2.5">
            <AnimatePresence mode="popLayout">
              {filtered.map((t, i) => (
                <motion.li key={t.id} layout
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3, ease: EASE, delay: Math.min(i * 0.03, 0.2) }}>
                  <AssignedRow task={t}
                    assigneeEmail={emailById.get(t.user_id) ?? null}
                    blockerTitle={t.blocked_by ? (titleById.get(t.blocked_by) ?? null) : null} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </AppShell>
  );
}

function AssignedRow({ task, assigneeEmail, blockerTitle }: {
  task: AssignedTask; assigneeEmail: string | null; blockerTitle: string | null;
}) {
  const isCyclic = task.task_type === "cyclic";
  const overdue = !task.is_done && !isCyclic && dueAt(task) < new Date();
  const status = task.is_done
    ? { label: "Done", cls: "bg-[#3D9E77]/10 text-[#3D9E77]" }
    : overdue ? { label: "Overdue", cls: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400" }
    : blockerTitle ? { label: "Blocked", cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" }
    : { label: "Active", cls: "bg-muted text-muted-foreground" };

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: EASE }}>
      <Panel className="flex items-center gap-3 px-4 py-3.5 transition-shadow hover:shadow-md hover:shadow-black/5">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
          {initials(assigneeEmail)}
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("truncate text-sm font-medium", task.is_done && "text-muted-foreground line-through")}>{task.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted-foreground">
            <span className="truncate font-medium text-foreground/70">{assigneeEmail ?? "Unknown"}</span>
            <span aria-hidden>·</span>
            {isCyclic ? (
              <span className="inline-flex items-center gap-1"><Repeat className="size-3" /><span className="capitalize">{task.recurrence}</span> · {task.due_time.slice(0, 5)}</span>
            ) : (
              <span className="inline-flex items-center gap-1"><CalendarClock className="size-3" />{formatDue(task)}</span>
            )}
            {task.importance === "high" && (
              <span className="inline-flex items-center gap-1 font-semibold text-red-600 dark:text-red-400"><Flag className="size-3" />High</span>
            )}
            {blockerTitle && (
              <span className="inline-flex min-w-0 items-center gap-1 text-amber-600 dark:text-amber-400">
                <Link2 className="size-3 shrink-0" /> <span className="truncate">waits on {blockerTitle}</span>
              </span>
            )}
          </div>
        </div>
        <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold", status.cls)}>{status.label}</span>
      </Panel>
    </motion.div>
  );
}

function EmptyState({ icon: Icon, title, body }: { icon: typeof Plus; title: string; body: string }) {
  return (
    <Reveal>
      <Panel className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-[#3D9E77]/10 text-[#3D9E77]">
          <Icon className="size-6" />
        </div>
        <div className="space-y-1">
          <p className="font-heading text-lg font-bold">{title}</p>
          <p className="mx-auto max-w-xs text-sm text-muted-foreground">{body}</p>
        </div>
      </Panel>
    </Reveal>
  );
}
