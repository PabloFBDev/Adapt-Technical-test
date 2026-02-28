import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { TicketList } from "@/components/tickets/ticket-list";
import { TicketFilters } from "@/components/tickets/ticket-filters";
import { TicketStats } from "@/components/tickets/ticket-stats";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function TicketsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tickets</h1>
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mt-1">
            painel de incidentes
          </p>
        </div>
        <Link href="/tickets/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Ticket
          </Button>
        </Link>
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
