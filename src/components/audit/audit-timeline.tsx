import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AuditLog, User } from "@prisma/client";

type AuditLogWithUser = AuditLog & {
  user: Pick<User, "id" | "email" | "name">;
};

const actionLabels = {
  created: "Criado",
  updated: "Atualizado",
  status_changed: "Status alterado",
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
        <div className="space-y-4">
          {auditLogs.map((log) => {
            const changes = log.changes as Record<
              string,
              { from: unknown; to: unknown }
            >;

            return (
              <div key={log.id} className="border-l-2 border-muted pl-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {actionLabels[log.action as keyof typeof actionLabels] || log.action}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {log.user.name || log.user.email}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString("pt-BR")}
                  </span>
                </div>
                <div className="space-y-1">
                  {Object.entries(changes).map(([field, change]) => (
                    <div key={field} className="text-sm">
                      <span className="font-medium">
                        {fieldLabels[field] || field}:
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {formatValue(field, change.from)}
                      </span>
                      {" → "}
                      <span>{formatValue(field, change.to)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
