import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const priorityConfig = {
  low: {
    label: "Baixa",
    prefix: "~",
    className: "bg-priority-low/10 text-priority-low border-priority-low/25",
    glow: false,
  },
  medium: {
    label: "Media",
    prefix: "!",
    className: "bg-priority-medium/10 text-priority-medium border-priority-medium/25 shadow-priority-medium/5",
    glow: false,
  },
  high: {
    label: "Alta",
    prefix: "!!",
    className: "bg-priority-high/10 text-priority-high border-priority-high/25 shadow-priority-high/5",
    glow: true,
  },
} as const;

export function PriorityBadge({ priority }: { priority: keyof typeof priorityConfig }) {
  const config = priorityConfig[priority];
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono text-[10px] tracking-wider rounded-full px-2.5 shadow-sm",
        config.className,
        config.glow && "animate-glow-pulse"
      )}
      style={config.glow ? { "--glow-color": "var(--priority-high)" } as React.CSSProperties : undefined}
    >
      <span className="opacity-50">{config.prefix}</span>
      {config.label}
    </Badge>
  );
}
