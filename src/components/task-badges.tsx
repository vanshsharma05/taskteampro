import { Badge } from "@/components/ui/badge";

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
