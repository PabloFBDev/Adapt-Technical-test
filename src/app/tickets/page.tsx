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
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] text-primary/80 uppercase tracking-widest mb-1.5">
            painel de incidentes
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
        </div>
        <Link href="/tickets/new">
          <Button className="gap-2 rounded-lg shadow-lg shadow-primary/15 hover:shadow-primary/25 transition-shadow">
            <Plus className="h-4 w-4" />
            Novo Ticket
          </Button>
        </Link>
      </div>

      <TicketStats />

      <Suspense fallback={<Skeleton className="h-10 w-full rounded-xl" />}>
        <TicketFilters />
      </Suspense>

      <Suspense
        fallback={
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        }
      >
        <TicketList />
      </Suspense>
    </div>
  );
}
