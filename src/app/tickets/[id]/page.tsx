import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TicketDetail } from "@/components/tickets/ticket-detail";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import type { TicketWithRelations } from "@/types";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, name: true } },
      auditLogs: {
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      aiCache: true,
    },
  });

  if (!ticket) {
    notFound();
  }

  return (
    <>
      <Breadcrumbs items={[
        { label: "Tickets", href: "/tickets" },
        { label: `#${ticket.id.slice(0, 8)}` },
      ]} />
      <TicketDetail
        ticket={ticket as TicketWithRelations}
        isAuthenticated={!!session}
      />
    </>
  );
}
