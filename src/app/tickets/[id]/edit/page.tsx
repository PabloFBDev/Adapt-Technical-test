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
        <h1 className="text-2xl font-semibold">Editar Ticket</h1>
        <TicketForm mode="edit" ticket={ticket} />
      </div>
    </AuthGuard>
  );
}
