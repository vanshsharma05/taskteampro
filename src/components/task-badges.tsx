import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type TaskStatus = "overdue" | "today" | "upcoming" | "done";

const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  overdue: {
    label: "Overdue",
    className:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400",
  },
  today: {
    label: "Due today",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  upcoming: {
    label: "Upcoming",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  done: {
    label: "Done",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}

export function PriorityBadge({
  importance,
}: {
  importance: "normal" | "high";
}) {
  if (importance !== "high") return null;
  return (
    <Badge
      variant="outline"
      className="border-amber-200 bg-amber-50 font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-400"
    >
      High priority
    </Badge>
  );
}
