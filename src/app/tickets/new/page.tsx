import { AuthGuard } from "@/components/auth/auth-guard";
import { TicketForm } from "@/components/tickets/ticket-form";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export default function NewTicketPage() {
  return (
    <AuthGuard>
      <div className="space-y-6">
        <Breadcrumbs items={[
          { label: "Tickets", href: "/tickets" },
          { label: "Novo" },
        ]} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Criar Ticket</h1>
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mt-1">
            novo incidente
          </p>
        </div>
        <TicketForm mode="create" />
      </div>
    </AuthGuard>
  );
}
