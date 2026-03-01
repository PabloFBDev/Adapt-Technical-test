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
          <div className="rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 p-3">
            <PlusCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-mono text-[10px] text-primary/70 uppercase tracking-widest mb-0.5">
              novo incidente
            </p>
            <h1 className="text-2xl font-bold tracking-tight">Criar Ticket</h1>
          </div>
        </div>
        <TicketForm mode="create" />
      </div>
    </AuthGuard>
  );
}
