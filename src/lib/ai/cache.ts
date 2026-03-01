import { prisma } from "@/lib/prisma";
import type { AIResult } from "./types";

const DEFAULT_TTL_MS = 3600000; // 1 hour

export async function getCachedResult(
  ticketId: string,
): Promise<AIResult | null> {
  const cached = await prisma.aICache.findUnique({
    where: { ticketId },
  });

  if (!cached) return null;

  if (new Date() > cached.expiresAt) {
    await prisma.aICache.delete({ where: { ticketId } });
    return null;
  }

  return cached.result as unknown as AIResult;
}

export async function setCachedResult(
  ticketId: string,
  result: AIResult,
  cacheTtlMs?: number,
): Promise<void> {
  const ttl = cacheTtlMs ?? DEFAULT_TTL_MS;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttl);

  await prisma.aICache.upsert({
    where: { ticketId },
    update: {
      result: JSON.parse(JSON.stringify(result)),
      createdAt: now,
      expiresAt,
    },
    create: {
      ticketId,
      result: JSON.parse(JSON.stringify(result)),
      createdAt: now,
      expiresAt,
    },
  });
}

export async function invalidateCache(ticketId: string): Promise<void> {
  await prisma.aICache.deleteMany({
    where: { ticketId },
  });
}
