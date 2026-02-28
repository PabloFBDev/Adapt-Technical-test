import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTicketSchema } from "@/schemas/ticket";
import { handleApiError, NotFoundError } from "@/lib/utils";
import { invalidateCache } from "@/lib/ai/cache";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        auditLogs: {
          include: {
            user: { select: { id: true, email: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        aiCache: true,
      },
    });

    if (!ticket) {
      throw new NotFoundError("Ticket not found");
    }

    return NextResponse.json({ data: ticket });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existingTicket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!existingTicket) {
      throw new NotFoundError("Ticket not found");
    }

    const body = await request.json();
    const data = updateTicketSchema.parse(body);

    // Compute diff — only include fields that actually changed
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    let hasStatusChange = false;

    if (data.title !== undefined && data.title !== existingTicket.title) {
      changes.title = { from: existingTicket.title, to: data.title };
    }
    if (
      data.description !== undefined &&
      data.description !== existingTicket.description
    ) {
      changes.description = {
        from: existingTicket.description,
        to: data.description,
      };
    }
    if (
      data.priority !== undefined &&
      data.priority !== existingTicket.priority
    ) {
      changes.priority = { from: existingTicket.priority, to: data.priority };
    }
    if (data.status !== undefined && data.status !== existingTicket.status) {
      changes.status = { from: existingTicket.status, to: data.status };
      hasStatusChange = true;
    }
    if (data.tags !== undefined) {
      const uniqueTags = [...new Set(data.tags)];
      const tagsChanged =
        JSON.stringify(existingTicket.tags.sort()) !==
        JSON.stringify(uniqueTags.sort());
      if (tagsChanged) {
        changes.tags = { from: existingTicket.tags, to: uniqueTags };
        data.tags = uniqueTags;
      }
    }

    // If nothing changed, return ticket as-is
    if (Object.keys(changes).length === 0) {
      return NextResponse.json({ data: existingTicket });
    }

    // Update ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.tags !== undefined && { tags: data.tags }),
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        ticketId: id,
        userId: session.user.id,
        action: hasStatusChange ? "status_changed" : "updated",
        changes: JSON.parse(JSON.stringify(changes)),
      },
    });

    // Invalidate AI cache if title or description changed
    if (changes.title || changes.description) {
      await invalidateCache(id);
    }

    return NextResponse.json({ data: updatedTicket });
  } catch (error) {
    return handleApiError(error);
  }
}
