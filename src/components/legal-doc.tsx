import { MarketingShell } from "@/components/marketing-shell";

export function LegalDoc({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <MarketingShell>
      <article className="mx-auto max-w-3xl px-5 pb-24 pt-32">
        <p className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Legal</p>
        <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated {updated}</p>
        <div className="mt-10 [&_a]:font-medium [&_a]:text-indigo-600 [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-10 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-foreground [&_li]:text-[15px] [&_li]:leading-relaxed [&_li]:text-muted-foreground [&_p]:mt-3 [&_p]:text-[15px] [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 dark:[&_a]:text-indigo-400">
          {children}
        </div>
      </article>
    </MarketingShell>
  );
}
