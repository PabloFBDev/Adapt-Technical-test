import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTicketSchema, ticketQuerySchema } from "@/schemas/ticket";
import { handleApiError } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = ticketQuerySchema.parse(
      Object.fromEntries(searchParams.entries()),
    );

    const where: Prisma.TicketWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }
    if (query.priority) {
      where.priority = query.priority;
    }
    if (query.tags) {
      const tagList = query.tags.split(",").map((t) => t.trim());
      where.tags = { hasSome: tagList };
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
        orderBy: { [query.sortBy]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.ticket.count({ where }),
    ]);

    return NextResponse.json({
      data: tickets,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createTicketSchema.parse(body);

    // Deduplicate tags
    const uniqueTags = [...new Set(data.tags)];

    const ticket = await prisma.$transaction(async (tx) => {
      const created = await tx.ticket.create({
        data: {
          title: data.title,
          description: data.description,
          priority: data.priority,
          tags: uniqueTags,
          userId: session.user.id,
        },
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          ticketId: created.id,
          userId: session.user.id,
          action: "created",
          changes: {
            title: { from: null, to: created.title },
            description: { from: null, to: created.description },
            priority: { from: null, to: created.priority },
            status: { from: null, to: created.status },
            tags: { from: null, to: created.tags },
          },
        },
      });

      return created;
    });

    return NextResponse.json({ data: ticket }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
