"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/tickets?${searchParams.toString()}`);
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
  }, [searchParams]);

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
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">Nenhum ticket encontrado</p>
        <p className="text-muted-foreground text-sm mt-1">
          Tente ajustar os filtros ou criar um novo ticket.
        </p>
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
        {data.data.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Pagina {pagination.page} de {pagination.totalPages} ({pagination.total} tickets)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            Proxima
          </Button>
        </div>
      )}
    </div>
  );
}
