import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AuthGuard } from "@/components/auth/auth-guard";
import { TicketForm } from "@/components/tickets/ticket-form";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Pencil } from "lucide-react";

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
        <Breadcrumbs items={[
          { label: "Tickets", href: "/tickets" },
          { label: `#${ticket.id.slice(0, 8)}`, href: `/tickets/${ticket.id}` },
          { label: "Editar" },
        ]} />
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Pencil className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Editar Ticket</h1>
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mt-0.5">
              editar incidente
            </p>
          </div>
        </div>
        <TicketForm mode="edit" ticket={ticket} />
      </div>
    </AuthGuard>
  );
}
