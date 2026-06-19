export function ShellSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden w-64 shrink-0 flex-col gap-4 border-r border-border bg-card px-3 py-5 md:flex">
        <div className="flex items-center gap-2.5 px-2">
          <div className="size-9 animate-pulse rounded-xl bg-muted" />
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        </div>
        <div className="mt-5 space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-9 animate-pulse rounded-lg bg-muted/70" />)}
        </div>
        <div className="mt-auto space-y-2">
          <div className="h-12 animate-pulse rounded-lg bg-muted/70" />
          <div className="h-9 animate-pulse rounded-lg bg-muted/70" />
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-border px-5 py-4">
          <div className="h-6 w-40 animate-pulse rounded bg-muted" />
          <div className="ml-auto h-9 w-32 animate-pulse rounded-full bg-muted" />
        </header>
        <main className="flex-1 overflow-y-auto px-5 py-6">
          <div className="mx-auto w-full max-w-3xl space-y-3">
            {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/60" />)}
          </div>
        </main>
      </div>
    </div>
  );
}
