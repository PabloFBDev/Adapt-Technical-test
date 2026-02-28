import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { summarizeSchema } from "@/schemas/ai";
import { getAIProvider } from "@/lib/ai/factory";
import { getCachedResult, setCachedResult } from "@/lib/ai/cache";
import { handleApiError, NotFoundError } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const input = summarizeSchema.parse(body);

    let title: string;
    let description: string;
    let ticketId: string | null = null;

    if ("ticketId" in input) {
      ticketId = input.ticketId;

      // Check cache first
      const cached = await getCachedResult(ticketId);
      if (cached) {
        console.log(`[AI] Returning cached result for ticket ${ticketId}`);
        return NextResponse.json({ data: cached, cached: true });
      }

      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });
      if (!ticket) {
        throw new NotFoundError("Ticket not found");
      }
      title = ticket.title;
      description = ticket.description;
    } else {
      title = input.title;
      description = input.description;
    }

    // Stream response via SSE
    const encoder = new TextEncoder();
    const provider = getAIProvider();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = provider.generateSummary({ title, description });

          for await (const chunk of generator) {
            const data = JSON.stringify(chunk);
            controller.enqueue(
              encoder.encode(`data: ${data}\n\n`)
            );

            // If this is the done event, cache the result
            if (chunk.type === "done" && ticketId) {
              await setCachedResult(ticketId, chunk.result);
              console.log(`[AI] Cached result for ticket ${ticketId}`);
            }
          }

          controller.close();
        } catch (error) {
          console.error("[AI] Streaming error:", error);
          const errorData = JSON.stringify({
            type: "error",
            message: "Failed to generate summary",
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
