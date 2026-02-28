import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig = {
  open: {
    label: "Aberto",
    className: "bg-status-open/15 text-status-open border-status-open/30",
    glow: true,
  },
  in_progress: {
    label: "Em Progresso",
    className: "bg-status-progress/15 text-status-progress border-status-progress/30",
    glow: true,
  },
  done: {
    label: "Concluido",
    className: "bg-status-done/15 text-status-done border-status-done/30",
    glow: false,
  },
} as const;

export function StatusBadge({ status }: { status: keyof typeof statusConfig }) {
  const config = statusConfig[status];
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono text-[11px] tracking-wide gap-1.5",
        config.className,
        config.glow && "animate-glow-pulse"
      )}
      style={config.glow ? { "--glow-color": `var(--status-${status === "in_progress" ? "progress" : status})` } as React.CSSProperties : undefined}
    >
      <span className={cn(
        "inline-block h-1.5 w-1.5 rounded-full",
        status === "open" && "bg-status-open",
        status === "in_progress" && "bg-status-progress",
        status === "done" && "bg-status-done"
      )} />
      {config.label}
    </Badge>
  );
}
