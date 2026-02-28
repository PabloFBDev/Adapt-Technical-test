import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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
        <CardTitle className="text-lg">Historico de Mudancas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6">
          {/* Vertical timeline line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

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
                  "relative pl-7 animate-fade-in-up",
                  staggerClass
                )}
              >
                {/* Colored dot */}
                <div className={cn(
                  "absolute left-0 top-1 h-[15px] w-[15px] rounded-full border-2 border-background",
                  dotColor
                )} />

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-medium">
                      {actionLabels[action] || log.action}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {log.user.name || log.user.email}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      {new Date(log.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(changes).map(([field, change]) => (
                      <div key={field} className="text-sm">
                        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                          {fieldLabels[field] || field}:
                        </span>{" "}
                        <span className="text-muted-foreground line-through decoration-muted-foreground/40">
                          {formatValue(field, change.from)}
                        </span>
                        {" → "}
                        <span>{formatValue(field, change.to)}</span>
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
