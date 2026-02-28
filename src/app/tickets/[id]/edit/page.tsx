import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AuthGuard } from "@/components/auth/auth-guard";
import { TicketForm } from "@/components/tickets/ticket-form";

export default async function EditTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
  });

  if (!ticket) {
    notFound();
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Editar Ticket</h1>
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mt-1">
            editar incidente
          </p>
        </div>
        <TicketForm mode="edit" ticket={ticket} />
      </div>
    </AuthGuard>
  );
}
