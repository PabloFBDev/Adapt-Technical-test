import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { History } from "lucide-react";
import type { AuditLogWithUser } from "@/types";

const actionLabels = {
  created: "Criado",
  updated: "Atualizado",
  status_changed: "Status alterado",
} as const;

const actionDotColors = {
  created: "bg-status-done",
  updated: "bg-primary",
  status_changed: "bg-status-progress",
} as const;

const fieldLabels: Record<string, string> = {
  title: "Titulo",
  description: "Descricao",
  priority: "Prioridade",
  status: "Status",
  tags: "Tags",
};

const statusLabels: Record<string, string> = {
  open: "Aberto",
  in_progress: "Em Progresso",
  done: "Concluido",
};

const priorityLabels: Record<string, string> = {
  low: "Baixa",
  medium: "Media",
  high: "Alta",
};

function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (field === "status") return statusLabels[String(value)] || String(value);
  if (field === "priority") return priorityLabels[String(value)] || String(value);
  if (field === "tags" && Array.isArray(value)) return value.join(", ") || "-";
  const str = String(value);
  return str.length > 80 ? str.substring(0, 80) + "..." : str;
}

export function AuditTimeline({ auditLogs }: { auditLogs: AuditLogWithUser[] }) {
  if (auditLogs.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-lg bg-primary/8 flex items-center justify-center">
            <History className="h-3.5 w-3.5 text-primary/70" />
          </div>
          <CardTitle className="text-lg font-bold">Historico de Mudancas</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6">
          {/* Vertical timeline line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-border/60 via-border/30 to-transparent" />

          {auditLogs.map((log, index) => {
            const changes = log.changes as Record<
              string,
              { from: unknown; to: unknown }
            >;
            const action = log.action as keyof typeof actionDotColors;
            const dotColor = actionDotColors[action] || "bg-muted-foreground";
            const staggerClass = index < 5 ? `stagger-${index + 1}` : "";

            return (
              <div
                key={log.id}
                className={cn(
                  "relative pl-8 animate-fade-in-up group/entry",
                  staggerClass
                )}
              >
                {/* Colored dot */}
                <div className={cn(
                  "absolute left-0 top-1 h-[15px] w-[15px] rounded-full border-2 border-background ring-2 ring-transparent transition-all duration-300 group-hover/entry:ring-current/15",
                  dotColor
                )} />

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold">
                      {actionLabels[action] || log.action}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground/70">
                      {log.user.name || log.user.email}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground/50 tabular-nums">
                      {new Date(log.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="space-y-1 pl-0.5">
                    {Object.entries(changes).map(([field, change]) => (
                      <div key={field} className="text-sm flex items-baseline gap-1.5">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 shrink-0">
                          {fieldLabels[field] || field}:
                        </span>
                        <span className="text-muted-foreground/50 line-through decoration-muted-foreground/30">
                          {formatValue(field, change.from)}
                        </span>
                        <span className="text-muted-foreground/30">&#8594;</span>
                        <span className="font-medium">{formatValue(field, change.to)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
