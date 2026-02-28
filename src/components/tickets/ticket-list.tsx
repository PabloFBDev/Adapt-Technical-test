"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Inbox, AlertTriangle, Plus } from "lucide-react";
import { TicketCard } from "./ticket-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { TicketListItem, PaginatedResponse } from "@/types";

export function TicketList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<TicketListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchString = searchParams.toString();

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/tickets?${searchString}`);
        if (!res.ok) throw new Error("Falha ao carregar tickets");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [searchString]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-in-up">
        <div className="rounded-full bg-destructive/10 p-6 mb-4">
          <AlertTriangle className="h-10 w-10 text-destructive/50" />
        </div>
        <p className="text-lg font-medium mb-1">Erro ao carregar</p>
        <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
          {error}
        </p>
        <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-in-up">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Inbox className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <p className="text-lg font-medium mb-1">Nenhum ticket encontrado</p>
        <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
          Tente ajustar os filtros ou crie um novo ticket para comecar.
        </p>
        <Link href="/tickets/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Ticket
          </Button>
        </Link>
      </div>
    );
  }

  const { pagination } = data;

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/tickets?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {data.data.map((ticket, index) => (
          <TicketCard key={ticket.id} ticket={ticket} index={index} />
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4 border-t border-border/50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="font-mono"
          >
            &larr; Anterior
          </Button>
          <span className="font-mono text-sm text-muted-foreground tabular-nums">
            {pagination.page} / {pagination.totalPages} ({pagination.total})
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="font-mono"
          >
            Proxima &rarr;
          </Button>
        </div>
      )}
    </div>
  );
}
