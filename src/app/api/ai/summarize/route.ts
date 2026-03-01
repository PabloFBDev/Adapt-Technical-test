import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { summarizeSchema } from "@/schemas/ai";
import { getAIProvider } from "@/lib/ai/factory";
import { getAISettings } from "@/lib/ai/settings";
import { getCachedResult, setCachedResult } from "@/lib/ai/cache";
import { AIProviderError } from "@/lib/ai/errors";
import { extractErrorMessage } from "@/lib/ai/errors";
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

    const explicitProvider = "provider" in input ? input.provider : undefined;

    if ("ticketId" in input) {
      ticketId = input.ticketId;

      // Check cache only when using the default provider
      if (!explicitProvider) {
        const cached = await getCachedResult(ticketId);
        if (cached) {
          return NextResponse.json({ data: cached, cached: true });
        }
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

    const settings = await getAISettings();

    // Validate provider before starting SSE stream
    let provider;
    try {
      provider = getAIProvider(settings, explicitProvider);
    } catch (err) {
      if (err instanceof AIProviderError) {
        return NextResponse.json({ error: err.message }, { status: 422 });
      }
      throw err;
    }

    // Stream response via SSE
    const encoder = new TextEncoder();

    const STREAM_TIMEOUT_MS = 30_000;

    const stream = new ReadableStream({
      async start(controller) {
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error("Stream timeout"));
          }, STREAM_TIMEOUT_MS);
        });

        try {
          const generator = provider.generateSummary({ title, description });

          const processStream = async () => {
            for await (const chunk of generator) {
              const data = JSON.stringify(chunk);
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));

              if (chunk.type === "done" && ticketId) {
                await setCachedResult(
                  ticketId,
                  chunk.result,
                  settings.cacheTtlMs,
                );
              }
            }
          };

          await Promise.race([processStream(), timeoutPromise]);

          controller.close();
        } catch (err) {
          console.error("[AI summarize] Stream error:", err);
          const message = extractErrorMessage(err);
          const errorData = JSON.stringify({ type: "error", message });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        } finally {
          clearTimeout(timeoutId);
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
