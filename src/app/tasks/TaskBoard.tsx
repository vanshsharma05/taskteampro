"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, LogOut, LayoutGrid, Building2, User, DollarSign,
  Briefcase, BarChart3, Calendar, Clock, MoreHorizontal, CheckSquare, Check, Menu, X, type LucideIcon,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { MorningBrief } from "@/components/morning-brief";
import { cn } from "@/lib/utils";

type Importance = "normal" | "high";
type Status = "pending" | "in_progress" | "done" | "escalated";
type Task = {
  id: string; title: string; description: string | null;
  due_date: string | null; due_time: string | null;
  importance: Importance; status: Status; category: string | null;
  is_done: boolean; completed_at: string | null;
};

const COLUMNS: { key: Status; label: string; dot: string }[] = [
  { key: "pending", label: "Pending", dot: "bg-slate-400" },
  { key: "in_progress", label: "In Progress", dot: "bg-blue-500" },
  { key: "done", label: "Done", dot: "bg-emerald-500" },
  { key: "escalated", label: "Escalated", dot: "bg-red-500" },
];

const CATEGORIES = [
  { key: "Business", icon: Building2, text: "text-indigo-500", dot: "bg-indigo-500" },
  { key: "Personal", icon: User, text: "text-violet-500", dot: "bg-violet-500" },
  { key: "Finance", icon: DollarSign, text: "text-emerald-500", dot: "bg-emerald-500" },
  { key: "Client", icon: Briefcase, text: "text-amber-500", dot: "bg-amber-500" },
  { key: "Operations", icon: BarChart3, text: "text-rose-500", dot: "bg-rose-500" },
] as const;

const selectClass = "h-10 w-full rounded-[8px] border border-input bg-transparent px-3 text-sm outline-none transition focus:border-foreground/30";

function dueInstant(t: Task) { return t.due_date ? new Date(`${t.due_date}T${t.due_time ?? "23:59:59"}+05:30`) : null; }
function isOverdue(t: Task) { const d = dueInstant(t); return !!d && t.status !== "done" && d < new Date(); }
function formatDue(t: Task) {
  if (!t.due_date) return null;
  const d = new Date(`${t.due_date}T${t.due_time ?? "00:00:00"}+05:30`);
  const dateStr = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", month: "short", day: "numeric" }).format(d);
  const timeStr = t.due_time ? new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }).format(d) : null;
  return { dateStr, timeStr };
}

export default function TaskBoard({ userId, userEmail, initialTasks }: { userId: string; userEmail: string; initialTasks: Task[] }) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "overdue" | "today">("all");
  const [query, setQuery] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [workHref, setWorkHref] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [importance, setImportance] = useState<Importance>("normal");
  const [category, setCategory] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await createClient()
        .from("profiles")
        .select("account_type, role")
        .eq("id", userId)
        .single();
      if (!active || !data) return;
      if (data.account_type === "business") {
        setWorkHref(data.role === "admin" ? "/admin" : "/staff");
      }
    })();
    return () => { active = false; };
  }, [userId]);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of tasks) if (t.category) m[t.category] = (m[t.category] ?? 0) + 1;
    return m;
  }, [tasks]);

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const visible = useMemo(() => tasks.filter((t) => {
    if (activeCategory && t.category !== activeCategory) return false;
    if (query && !t.title.toLowerCase().includes(query.toLowerCase())) return false;
    if (filter === "overdue" && !isOverdue(t)) return false;
    if (filter === "today" && t.due_date !== today) return false;
    return true;
  }), [tasks, activeCategory, query, filter, today]);

  const selectCategory = (key: string) => setActiveCategory((prev) => (prev === key ? null : key));
  const selectBoard = () => { setActiveCategory(null); setFilter("all"); };

  async function moveTask(task: Task, newStatus: Status) {
    setMenuFor(null);
    if (task.status === newStatus) return;
    const patch: Partial<Task> = { status: newStatus };
    if (newStatus === "done") { patch.is_done = true; patch.completed_at = new Date().toISOString(); }
    else if (task.status === "done") { patch.is_done = false; patch.completed_at = null; }
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...patch } : t)));
    await createClient().from("tasks").update(patch).eq("id", task.id);
  }

  async function deleteTask(task: Task) {
    setMenuFor(null);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    await createClient().from("tasks").delete().eq("id", task.id);
  }

  async function launch(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const payload = {
      user_id: userId, title: title.trim(), description: description.trim() || null,
      importance, status: "pending", category: category || null, task_type: "individual",
      due_date: dueDate || null, due_time: dueTime || null,
    };
    const { data, error } = await createClient().from("tasks").insert(payload)
      .select("id, title, description, due_date, due_time, importance, status, category, is_done, completed_at").single();
    setSaving(false);
    if (error) return;
    setTasks((prev) => [data as Task, ...prev]);
    setOpen(false);
    setTitle(""); setDescription(""); setImportance("normal"); setCategory(""); setDueDate(""); setDueTime("");
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login"); router.refresh();
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card px-3 py-5 md:flex">
        <BoardSidebar activeCategory={activeCategory} onSelectCategory={selectCategory} onSelectBoard={selectBoard} counts={counts} workHref={workHref} userEmail={userEmail} onSignOut={signOut} />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div key="backdrop" className="fixed inset-0 z-40 bg-black/40 md:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
            <motion.aside key="drawer" className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card px-3 py-5 md:hidden"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 320, damping: 32 }}>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu"
                className="absolute right-3 top-4 rounded-md p-1.5 text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-foreground active:scale-90">
                <X className="size-4" />
              </button>
              <BoardSidebar activeCategory={activeCategory} onSelectCategory={selectCategory} onSelectBoard={selectBoard} counts={counts} workHref={workHref} userEmail={userEmail} onSignOut={signOut} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-border px-5 py-3">
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu"
            className="rounded-md p-1.5 text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-foreground active:scale-90 md:hidden">
            <Menu className="size-5" />
          </button>
          <div className="relative hidden max-w-md flex-1 sm:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks..." className="h-10 w-full rounded-full border border-input bg-muted/40 pl-9 pr-4 text-sm outline-none transition focus:border-foreground/30 focus:bg-background" />
          </div>
          <div className="flex-1 sm:hidden" />
          <Button onClick={() => setOpen(true)} className="ml-auto rounded-full shadow-sm"><Plus className="size-4" /> Launch Task</Button>
        </header>

        <div className="flex items-center gap-2 px-5 pb-1 pt-4">
          {(["all", "overdue", "today"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-150 active:scale-95", filter === f ? "bg-foreground text-background" : "border border-border text-muted-foreground hover:border-foreground/30")}>
              {f === "all" ? "All" : f === "overdue" ? "Overdue" : "Due Today"}
            </button>
          ))}
        </div>

        <MorningBrief tasks={tasks} />

        <div className="flex-1 overflow-x-auto overflow-y-hidden px-5 pb-6 pt-4">
          <div className="flex h-full min-w-max gap-4">
            {COLUMNS.map((col) => {
              const items = visible.filter((t) => t.status === col.key);
              return (
                <div key={col.key} className="flex h-full w-[300px] shrink-0 flex-col">
                  <div className="mb-3 flex items-center gap-2 px-1">
                    <span className={cn("size-2 rounded-full", col.dot)} />
                    <h3 className="text-sm font-bold uppercase tracking-wide">{col.label}</h3>
                    <span className="text-sm text-muted-foreground">{items.length}</span>
                    <button onClick={() => setOpen(true)} className="ml-auto rounded-md p-1 text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-foreground active:scale-90"><Plus className="size-4" /></button>
                  </div>
                  <div className="flex-1 space-y-3 overflow-y-auto pb-2 pr-1">
                    <AnimatePresence mode="popLayout">
                      {items.map((t) => (
                        <TaskCard key={t.id} task={t} menuOpen={menuFor === t.id} onToggleMenu={() => setMenuFor(menuFor === t.id ? null : t.id)} onMove={moveTask} onDelete={deleteTask} />
                      ))}
                    </AnimatePresence>
                    {items.length === 0 && <div className="rounded-xl border border-dashed border-border py-10 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/50">Empty</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Launch a task</DialogTitle>
            <DialogDescription>Add it to your board.</DialogDescription>
          </DialogHeader>
          <form onSubmit={launch} className="flex flex-col gap-4">
            <div className="grid gap-1.5"><Label htmlFor="t-title">Task</Label><Input id="t-title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs doing?" required /></div>
            <div className="grid gap-1.5"><Label htmlFor="t-desc">Description <span className="text-muted-foreground">(optional)</span></Label><Input id="t-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add a note" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Priority</Label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setImportance("normal")} className={cn("flex-1 rounded-[8px] border px-3 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.97]", importance === "normal" ? "border-foreground bg-foreground text-background" : "border-input text-muted-foreground hover:border-foreground/40")}>Normal</button>
                  <button type="button" onClick={() => setImportance("high")} className={cn("flex-1 rounded-[8px] border px-3 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.97]", importance === "high" ? "border-red-500 bg-red-500 text-white" : "border-input text-muted-foreground hover:border-red-400")}>High</button>
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="t-cat">Context</Label>
                <select id="t-cat" value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
                  <option value="">None</option>
                  {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.key}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5"><Label htmlFor="t-date">Due date <span className="text-muted-foreground">(optional)</span></Label><Input id="t-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
              <div className="grid gap-1.5"><Label htmlFor="t-time">Time</Label><Input id="t-time" type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} /></div>
            </div>
            <DialogFooter><Button type="submit" disabled={saving}>{saving ? "Launching..." : "Launch task"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BoardSidebar({
  activeCategory, onSelectCategory, onSelectBoard, counts, workHref, userEmail, onSignOut, onNavigate,
}: {
  activeCategory: string | null; onSelectCategory: (key: string) => void; onSelectBoard: () => void;
  counts: Record<string, number>; workHref: string | null; userEmail: string; onSignOut: () => void; onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2.5 px-2">
        <div className="flex size-9 items-center justify-center rounded-xl bg-foreground text-background"><CheckSquare className="size-5" /></div>
        <div className="leading-tight">
          <p className="font-heading text-base font-bold tracking-tight">TeamTaskPro</p>
          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">Personal</span>
        </div>
      </div>

      {workHref && (
        <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/40 p-1">
          <span className="relative flex items-center justify-center gap-1.5 rounded-lg bg-background px-2 py-1.5 text-xs font-semibold text-foreground shadow-sm">
            <User className="size-3.5" /> Personal
          </span>
          <Link href={workHref} onClick={onNavigate} className="relative flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-muted-foreground transition-all duration-150 hover:text-foreground active:scale-95">
            <Building2 className="size-3.5" /> Work
          </Link>
        </div>
      )}

      <nav className={cn("space-y-1", workHref ? "mt-6" : "mt-7")}>
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Main menu</p>
        <button onClick={() => { onSelectBoard(); onNavigate?.(); }} className="flex w-full items-center gap-2.5 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background shadow-sm transition-all duration-150 active:scale-[0.97]">
          <LayoutGrid className="size-4" /> Board
        </button>
      </nav>

      <div className="mt-6 space-y-1">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Context types</p>
        {CATEGORIES.map((c) => (
          <button key={c.key} onClick={() => { onSelectCategory(c.key); onNavigate?.(); }}
            className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.97]", activeCategory === c.key ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60")}>
            <c.icon className={cn("size-4", c.text)} />
            <span className="flex-1 text-left">{c.key}</span>
            <span className="rounded-full bg-muted px-1.5 text-[11px] tabular-nums text-muted-foreground">{counts[c.key] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="mt-auto space-y-2 pt-6">
        <div className="flex items-center gap-2 rounded-lg px-2 py-2">
          <div className="flex size-9 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{(userEmail || "?").slice(0, 2).toUpperCase()}</div>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{userEmail}</p><p className="text-[11px] text-muted-foreground">Personal space</p></div>
          <ThemeToggle />
        </div>
        <button onClick={onSignOut} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-150 hover:bg-accent/60 hover:text-foreground active:scale-[0.97]"><LogOut className="size-4" /> Sign out</button>
      </div>
    </>
  );
}

function TaskCard({ task, menuOpen, onToggleMenu, onMove, onDelete }: { task: Task; menuOpen: boolean; onToggleMenu: () => void; onMove: (t: Task, s: Status) => void; onDelete: (t: Task) => void }) {
  const overdue = isOverdue(task);
  const due = formatDue(task);
  const cat = CATEGORIES.find((c) => c.key === task.category);
  const high = task.importance === "high";
  return (
    <motion.div layout initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} whileHover={{ y: -3 }}
      className="group relative rounded-xl border border-border bg-card shadow-sm">
      <div className="h-1 w-full rounded-t-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", high ? "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400" : "bg-muted text-muted-foreground")}>{high ? "High" : "Normal"}</span>
          <div className="relative">
            <button onClick={onToggleMenu} className="rounded-md p-1 text-muted-foreground opacity-0 transition-all duration-150 hover:bg-accent group-hover:opacity-100 active:scale-90"><MoreHorizontal className="size-4" /></button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={onToggleMenu} />
                <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg">
                  <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Move to</p>
                  {COLUMNS.filter((c) => c.key !== task.status).map((c) => (
                    <button key={c.key} onClick={() => onMove(task, c.key)} className="flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors duration-100 hover:bg-accent"><span className={cn("size-2 rounded-full", c.dot)} />{c.label}</button>
                  ))}
                  <div className="my-1 h-px bg-border" />
                  <button onClick={() => onDelete(task)} className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 transition-colors duration-100 hover:bg-red-50 dark:hover:bg-red-500/10">Delete</button>
                </div>
              </>
            )}
          </div>
        </div>
        <h4 className="mt-2 font-heading text-[15px] font-semibold leading-snug">{task.title}</h4>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{task.description || "No description provided."}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
          <span className="inline-flex items-center gap-1 text-muted-foreground"><User className="size-3.5" /> Me</span>
          {due && (
            <span className={cn("inline-flex items-center gap-1", overdue ? "font-semibold text-red-600 dark:text-red-400" : "text-muted-foreground")}>
              <Calendar className="size-3.5" /> {due.dateStr}{due.timeStr && <><Clock className="ml-1 size-3.5" /> {due.timeStr}</>}
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
            <span className={cn("size-2 rounded-full", cat ? cat.dot : "bg-muted-foreground/40")} />{task.category || "Uncategorized"}
          </span>
          {task.status === "done" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[12px] font-semibold text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"><Check className="size-3.5" /> Done</span>
          ) : overdue ? (
            <span className="text-[12px] font-bold italic text-red-600 dark:text-red-400">Overdue</span>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
