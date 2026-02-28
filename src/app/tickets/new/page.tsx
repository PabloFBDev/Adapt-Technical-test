import { AuthGuard } from "@/components/auth/auth-guard";
import { TicketForm } from "@/components/tickets/ticket-form";

export default function NewTicketPage() {
  return (
    <AuthGuard>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Criar Ticket</h1>
        <TicketForm mode="create" />
      </div>
    </AuthGuard>
  );
}
