"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <div className={cn("flex size-8 items-center justify-center rounded-lg font-heading text-sm font-bold shadow-sm", light ? "bg-white text-foreground" : "bg-foreground text-background")}>T</div>
      <span className={cn("font-heading text-lg font-bold tracking-tight", light && "text-white")}>TeamTaskPro</span>
    </Link>
  );
}

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const links = [
    { href: "/#how", label: "How it works" },
    { href: "/#features", label: "Features" },
    { href: "/#faq", label: "FAQ" },
  ];
  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 transition-all duration-300", scrolled ? "border-b border-border bg-background/80 backdrop-blur-xl" : "border-b border-transparent")}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-muted-foreground transition hover:text-foreground">{l.label}</Link>
          ))}
        </nav>
        <div className="hidden items-center gap-1.5 md:flex">
          <Link href="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground">Log in</Link>
          <Link href="/signup" className="group inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            Start free <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <button onClick={() => setOpen(!open)} aria-label="Menu" className="rounded-md p-1.5 text-foreground transition hover:bg-accent md:hidden">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden border-b border-border bg-background md:hidden">
            <div className="flex flex-col gap-1 px-5 py-3">
              {links.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground">{l.label}</Link>
              ))}
              <div className="mt-2 flex flex-col gap-2">
                <Link href="/login" onClick={() => setOpen(false)} className="rounded-full border border-border px-4 py-2 text-center text-sm font-semibold">Log in</Link>
                <Link href="/signup" onClick={() => setOpen(false)} className="rounded-full bg-foreground px-4 py-2 text-center text-sm font-semibold text-background">Start free</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function Footer() {
  const cols = [
    { title: "Product", links: [{ href: "/#features", label: "Features" }, { href: "/#how", label: "How it works" }, { href: "/#faq", label: "FAQ" }] },
    { title: "Company", links: [{ href: "/about", label: "About" }, { href: "/contact", label: "Contact" }] },
    { title: "Legal", links: [{ href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" }] },
  ];
  return (
    <footer className="border-t border-border px-5 py-14">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">Know your team&apos;s work is getting done.</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="text-sm font-semibold">{c.title}</p>
            <ul className="mt-3 space-y-2">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground transition hover:text-foreground">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-12 flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
        <p className="text-[13px] text-muted-foreground">© {new Date().getFullYear()} TeamTaskPro. All rights reserved.</p>
        <Link href="/signup" className="text-[13px] font-semibold text-foreground transition hover:opacity-70">Get started →</Link>
      </div>
    </footer>
  );
}

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <Nav />
      {children}
      <Footer />
    </div>
  );
}
