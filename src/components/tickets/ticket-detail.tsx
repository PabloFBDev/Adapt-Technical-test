"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "./status-badge";
import { PriorityBadge } from "./priority-badge";
import { AISummary } from "@/components/ai/ai-summary";
import { AuditTimeline } from "@/components/audit/audit-timeline";
import type { TicketWithRelations } from "@/types";
import type { TicketStatus } from "@prisma/client";

interface TicketDetailProps {
  ticket: TicketWithRelations;
  isAuthenticated: boolean;
}

export function TicketDetail({ ticket, isAuthenticated }: TicketDetailProps) {
  const router = useRouter();
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [changingStatus, setChangingStatus] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return;
    setChangingStatus(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Falha ao atualizar status");
      setStatus(newStatus as TicketStatus);
      toast.success("Status atualizado!");
      router.refresh();
    } catch {
      toast.error("Erro ao atualizar status");
    } finally {
      setChangingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-xl">{ticket.title}</CardTitle>
            <div className="flex gap-2 shrink-0">
              <StatusBadge status={status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground whitespace-pre-wrap">
            {ticket.description}
          </p>

          <div className="flex flex-wrap gap-1">
            {ticket.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>

          <Separator />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="space-y-1">
              <p>Criado por: {ticket.user.name || ticket.user.email}</p>
              <p>Criado em: {new Date(ticket.createdAt).toLocaleString("pt-BR")}</p>
              <p>Atualizado em: {new Date(ticket.updatedAt).toLocaleString("pt-BR")}</p>
            </div>

            {isAuthenticated && (
              <div className="flex items-center gap-3">
                <Select
                  value={status}
                  onValueChange={handleStatusChange}
                  disabled={changingStatus}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Aberto</SelectItem>
                    <SelectItem value="in_progress">Em Progresso</SelectItem>
                    <SelectItem value="done">Concluido</SelectItem>
                  </SelectContent>
                </Select>

                <Link href={`/tickets/${ticket.id}/edit`}>
                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isAuthenticated && (
        <AISummary ticketId={ticket.id} cachedResult={ticket.aiCache} />
      )}

      <AuditTimeline auditLogs={ticket.auditLogs} />
    </div>
  );
}
