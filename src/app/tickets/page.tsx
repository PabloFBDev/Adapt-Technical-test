import { Suspense } from "react";
import { TicketList } from "@/components/tickets/ticket-list";
import { TicketFilters } from "@/components/tickets/ticket-filters";
import { TicketStats } from "@/components/tickets/ticket-stats";
import { Skeleton } from "@/components/ui/skeleton";

export default function TicketsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tickets</h1>
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mt-1">
          painel de incidentes
        </p>
      </div>

      <TicketStats />

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <TicketFilters />
      </Suspense>

      <Suspense
        fallback={
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        }
      >
        <TicketList />
      </Suspense>
    </div>
  );
}
