import { AuthGuard } from "@/components/auth/auth-guard";
import { TicketForm } from "@/components/tickets/ticket-form";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PlusCircle } from "lucide-react";

export default function NewTicketPage() {
  return (
    <AuthGuard>
      <div className="space-y-6">
        <Breadcrumbs items={[
          { label: "Tickets", href: "/tickets" },
          { label: "Novo" },
        ]} />
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <PlusCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Criar Ticket</h1>
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mt-0.5">
              novo incidente
            </p>
          </div>
        </div>
        <TicketForm mode="create" />
      </div>
    </AuthGuard>
  );
}
