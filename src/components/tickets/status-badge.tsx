import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig = {
  open: {
    label: "Aberto",
    className: "bg-status-open/10 text-status-open border-status-open/25 shadow-status-open/5",
    glow: true,
  },
  in_progress: {
    label: "Em Progresso",
    className: "bg-status-progress/10 text-status-progress border-status-progress/25 shadow-status-progress/5",
    glow: true,
  },
  done: {
    label: "Concluído",
    className: "bg-status-done/10 text-status-done border-status-done/25",
    glow: false,
  },
} as const;

export function StatusBadge({ status }: { status: keyof typeof statusConfig }) {
  const config = statusConfig[status];
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono text-[10px] tracking-wider gap-1.5 rounded-full px-2.5 shadow-sm",
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
