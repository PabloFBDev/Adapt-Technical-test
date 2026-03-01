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
import { Pencil, User, Calendar, RefreshCw } from "lucide-react";
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
    <div className="space-y-6 animate-fade-in-up">
      <Card className="relative border-l-[3px] border-l-primary overflow-hidden">
        {/* Subtle gradient accent */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/[0.02] to-transparent pointer-events-none" />

        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="font-mono text-[10px] text-muted-foreground/60 tracking-widest uppercase">
                #{ticket.id.slice(0, 8)}
              </span>
              <CardTitle className="text-xl font-bold tracking-tight mt-0.5">
                {ticket.title}
              </CardTitle>
            </div>
            <div className="flex gap-2 shrink-0">
              <StatusBadge status={status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-muted-foreground/80 whitespace-pre-wrap leading-relaxed">
            {ticket.description}
          </p>

          {ticket.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {ticket.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="font-mono text-[10px] px-2.5 py-0.5 rounded-full">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <Separator className="bg-border/40" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm p-5 rounded-xl bg-muted/20 border border-border/30">
            <div className="flex items-start gap-2.5">
              <div className="rounded-lg bg-primary/8 p-2 mt-0.5">
                <User className="h-3.5 w-3.5 text-primary/70" />
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 block mb-0.5">
                  Criado por
                </span>
                <span className="text-sm font-medium">{ticket.user.name || ticket.user.email}</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="rounded-lg bg-primary/8 p-2 mt-0.5">
                <Calendar className="h-3.5 w-3.5 text-primary/70" />
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 block mb-0.5">
                  Criado em
                </span>
                <span className="font-mono text-sm tabular-nums">
                  {new Date(ticket.createdAt).toLocaleString("pt-BR")}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="rounded-lg bg-primary/8 p-2 mt-0.5">
                <RefreshCw className="h-3.5 w-3.5 text-primary/70" />
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 block mb-0.5">
                  Atualizado em
                </span>
                <span className="font-mono text-sm tabular-nums">
                  {new Date(ticket.updatedAt).toLocaleString("pt-BR")}
                </span>
              </div>
            </div>
          </div>

          {isAuthenticated && (
            <>
              <Separator className="bg-border/40" />
              <div className="flex items-center gap-3">
                <Select
                  value={status}
                  onValueChange={handleStatusChange}
                  disabled={changingStatus}
                >
                  <SelectTrigger className="w-44 font-mono text-sm rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Aberto</SelectItem>
                    <SelectItem value="in_progress">Em Progresso</SelectItem>
                    <SelectItem value="done">Concluído</SelectItem>
                  </SelectContent>
                </Select>

                <Link href={`/tickets/${ticket.id}/edit`}>
                  <Button variant="outline" size="sm" className="gap-1.5 rounded-lg">
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {isAuthenticated && (
        <AISummary ticketId={ticket.id} cachedResult={ticket.aiCache} />
      )}

      <AuditTimeline auditLogs={ticket.auditLogs} />
    </div>
  );
}
