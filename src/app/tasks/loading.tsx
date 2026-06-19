export default function Loading() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden w-64 shrink-0 flex-col gap-4 border-r border-border bg-card px-3 py-5 md:flex">
        <div className="flex items-center gap-2.5 px-2">
          <div className="size-9 animate-pulse rounded-xl bg-muted" />
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        </div>
        <div className="mt-6 space-y-2">
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-9 animate-pulse rounded-lg bg-muted/70" />)}
        </div>
        <div className="mt-auto h-9 animate-pulse rounded-lg bg-muted/70" />
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-border px-5 py-3">
          <div className="hidden h-10 w-full max-w-md animate-pulse rounded-full bg-muted sm:block" />
          <div className="ml-auto h-9 w-32 animate-pulse rounded-full bg-muted" />
        </header>
        <div className="flex items-center gap-2 px-5 pb-1 pt-4">
          {[0, 1, 2].map((i) => <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-muted/70" />)}
        </div>
        <div className="flex-1 overflow-hidden px-5 pb-6 pt-4">
          <div className="flex h-full gap-4">
            {[0, 1, 2, 3].map((col) => (
              <div key={col} className="flex w-[300px] shrink-0 flex-col gap-3">
                <div className="h-5 w-32 animate-pulse rounded bg-muted/70" />
                {[0, 1].map((c) => <div key={c} className="h-32 animate-pulse rounded-xl bg-muted/60" />)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
