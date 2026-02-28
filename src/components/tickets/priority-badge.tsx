import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const priorityConfig = {
  low: {
    label: "Baixa",
    prefix: "~",
    className: "bg-priority-low/15 text-priority-low border-priority-low/30",
    glow: false,
  },
  medium: {
    label: "Media",
    prefix: "!",
    className: "bg-priority-medium/15 text-priority-medium border-priority-medium/30",
    glow: false,
  },
  high: {
    label: "Alta",
    prefix: "!!",
    className: "bg-priority-high/15 text-priority-high border-priority-high/30",
    glow: true,
  },
} as const;

export function PriorityBadge({ priority }: { priority: keyof typeof priorityConfig }) {
  const config = priorityConfig[priority];
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono text-[11px] tracking-wide",
        config.className,
        config.glow && "animate-glow-pulse"
      )}
      style={config.glow ? { "--glow-color": "var(--priority-high)" } as React.CSSProperties : undefined}
    >
      <span className="opacity-60">{config.prefix}</span>
      {config.label}
    </Badge>
  );
}
