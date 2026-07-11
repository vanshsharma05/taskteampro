"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Users, ClipboardList, ListChecks, LogOut, User, Building2, Menu, X, type LucideIcon } from "lucide-react";
import { LogoMark } from "@/components/brand-logo";
import { createClient } from "@/utils/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export type Role = "individual" | "admin" | "member" | "business";

type NavItem = { label: string; href: string; icon: LucideIcon };

const NAV: Record<Role, NavItem[]> = {
  individual: [{ label: "Board", href: "/tasks", icon: LayoutGrid }],
  admin: [
    { label: "Dashboard", href: "/admin", icon: LayoutGrid },
    { label: "Team", href: "/team", icon: Users },
    { label: "Assign", href: "/assign", icon: ClipboardList },
  ],
  business: [
    { label: "Dashboard", href: "/admin", icon: LayoutGrid },
    { label: "Team", href: "/team", icon: Users },
    { label: "Assign", href: "/assign", icon: ClipboardList },
  ],
  member: [{ label: "My Work", href: "/staff", icon: ListChecks }],
};

export function AppShell({
  role, userEmail, title, primaryAction, children,
}: {
  role: Role; userEmail: string; title: string; primaryAction?: React.ReactNode; children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = NAV[role] ?? [];
  const hasPersonal = role !== "individual";
  const inPersonal = pathname.startsWith("/tasks");

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login"); router.refresh();
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card px-3 py-5 md:flex">
        <SidebarBody role={role} items={items} pathname={pathname} hasPersonal={hasPersonal} inPersonal={inPersonal} userEmail={userEmail} onSignOut={signOut} />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)} />
            <motion.aside
              key="drawer"
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card px-3 py-5 md:hidden"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu"
                className="absolute right-3 top-4 rounded-md p-1.5 text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-foreground active:scale-90">
                <X className="size-4" />
              </button>
              <SidebarBody role={role} items={items} pathname={pathname} hasPersonal={hasPersonal} inPersonal={inPersonal} userEmail={userEmail} onSignOut={signOut} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-border px-5 py-4">
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu"
            className="rounded-md p-1.5 text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-foreground active:scale-90 md:hidden">
            <Menu className="size-5" />
          </button>
          <motion.h1
            key={title}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="truncate font-heading text-xl font-bold tracking-tight">
            {title}
          </motion.h1>
          <div className="ml-auto flex items-center gap-2">{primaryAction}</div>
        </header>
        <main className="flex-1 overflow-y-auto px-5 py-6">{children}</main>
      </div>
    </div>
  );
}

function SidebarBody({
  role, items, pathname, hasPersonal, inPersonal, userEmail, onSignOut, onNavigate,
}: {
  role: Role; items: NavItem[]; pathname: string; hasPersonal: boolean; inPersonal: boolean;
  userEmail: string; onSignOut: () => void; onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2.5 px-2">
        <LogoMark className="size-9 rounded-xl shadow-sm ring-1 ring-white/10" />
        <div className="leading-tight">
          <p className="font-heading text-base font-bold tracking-tight">TaskTeam<span className="text-emerald-500">Pro</span></p>
          <span className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase",
            inPersonal
              ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
              : "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
          )}>
            {inPersonal ? "Personal" : role === "member" ? "Work" : "Workspace"}
          </span>
        </div>
      </div>

      {hasPersonal && (
        <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/40 p-1">
          <Link href="/tasks" onClick={onNavigate} className={cn(
            "relative flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-95",
            inPersonal ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}>
            <User className="size-3.5" /> Personal
          </Link>
          <Link href={role === "member" ? "/staff" : "/admin"} onClick={onNavigate} className={cn(
            "relative flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-95",
            !inPersonal ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}>
            <Building2 className="size-3.5" /> Work
          </Link>
        </div>
      )}

      <nav className="mt-6 space-y-1">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Main menu</p>
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.97]",
                active ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}>
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 pt-6">
        <div className="flex items-center gap-2 rounded-lg px-2 py-2">
          <div className="flex size-9 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
            {(userEmail || "?").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{userEmail}</p>
            <p className="text-[11px] capitalize text-muted-foreground">{role}</p>
          </div>
          <ThemeToggle />
        </div>
        <button onClick={onSignOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-150 hover:bg-accent/60 hover:text-foreground active:scale-[0.97]">
          <LogOut className="size-4" /> Sign out
        </button>
      </div>
    </>
  );
}
