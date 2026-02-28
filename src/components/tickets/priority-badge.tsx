import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const priorityConfig = {
  low: { label: "Baixa", className: "bg-gray-100 text-gray-800 hover:bg-gray-100" },
  medium: { label: "Media", className: "bg-orange-100 text-orange-800 hover:bg-orange-100" },
  high: { label: "Alta", className: "bg-red-100 text-red-800 hover:bg-red-100" },
} as const;

export function PriorityBadge({ priority }: { priority: keyof typeof priorityConfig }) {
  const config = priorityConfig[priority];
  return (
    <Badge variant="secondary" className={cn(config.className)}>
      {config.label}
    </Badge>
  );
}
