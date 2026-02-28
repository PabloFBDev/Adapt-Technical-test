import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig = {
  open: { label: "Aberto", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  in_progress: { label: "Em Progresso", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  done: { label: "Concluido", className: "bg-green-100 text-green-800 hover:bg-green-100" },
} as const;

export function StatusBadge({ status }: { status: keyof typeof statusConfig }) {
  const config = statusConfig[status];
  return (
    <Badge variant="secondary" className={cn(config.className)}>
      {config.label}
    </Badge>
  );
}
