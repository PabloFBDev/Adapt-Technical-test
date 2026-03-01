import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/utils";

export async function GET() {
  try {
    const [statusCounts, priorityCounts, total] = await Promise.all([
      prisma.ticket.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.ticket.groupBy({
        by: ["priority"],
        _count: { priority: true },
      }),
      prisma.ticket.count(),
    ]);

    const byStatus = {
      open: 0,
      in_progress: 0,
      done: 0,
    };
    for (const row of statusCounts) {
      byStatus[row.status] = row._count.status;
    }

    const byPriority = {
      low: 0,
      medium: 0,
      high: 0,
    };
    for (const row of priorityCounts) {
      byPriority[row.priority] = row._count.priority;
    }

    return NextResponse.json({
      total,
      byStatus,
      byPriority,
    });
  } catch (error) {
    console.error("[stats] Error:", error);
    return handleApiError(error);
  }
}
