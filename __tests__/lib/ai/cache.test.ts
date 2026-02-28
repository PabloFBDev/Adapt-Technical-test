import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCachedResult, setCachedResult, invalidateCache } from "@/lib/ai/cache";
import { prisma } from "@/lib/prisma";
import type { AIResult } from "@/lib/ai/types";

const mockPrisma = vi.mocked(prisma);

const sampleResult: AIResult = {
  summary: "Test summary",
  nextSteps: ["Step 1", "Step 2", "Step 3"],
  riskLevel: "medium",
  categories: ["task"],
};

describe("AI Cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCachedResult", () => {
    it("should return null when no cache exists", async () => {
      mockPrisma.aICache.findUnique.mockResolvedValue(null);

      const result = await getCachedResult("ticket-1");
      expect(result).toBeNull();
    });

    it("should return cached result when cache is valid", async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.aICache.findUnique.mockResolvedValue({
        id: "cache-1",
        ticketId: "ticket-1",
        result: sampleResult as unknown as Record<string, unknown>,
        createdAt: new Date(),
        expiresAt: futureDate,
      });

      const result = await getCachedResult("ticket-1");
      expect(result).toEqual(sampleResult);
    });

    it("should return null and delete when cache is expired", async () => {
      const pastDate = new Date(Date.now() - 1000);
      mockPrisma.aICache.findUnique.mockResolvedValue({
        id: "cache-1",
        ticketId: "ticket-1",
        result: sampleResult as unknown as Record<string, unknown>,
        createdAt: new Date(Date.now() - 7200000),
        expiresAt: pastDate,
      });

      const result = await getCachedResult("ticket-1");
      expect(result).toBeNull();
      expect(mockPrisma.aICache.delete).toHaveBeenCalledWith({
        where: { ticketId: "ticket-1" },
      });
    });
  });

  describe("setCachedResult", () => {
    it("should upsert cache with TTL", async () => {
      mockPrisma.aICache.upsert.mockResolvedValue({
        id: "cache-1",
        ticketId: "ticket-1",
        result: sampleResult as unknown as Record<string, unknown>,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      });

      await setCachedResult("ticket-1", sampleResult);

      expect(mockPrisma.aICache.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ticketId: "ticket-1" },
          create: expect.objectContaining({
            ticketId: "ticket-1",
            result: sampleResult,
          }),
          update: expect.objectContaining({
            result: sampleResult,
          }),
        })
      );
    });
  });

  describe("invalidateCache", () => {
    it("should delete cache for given ticketId", async () => {
      mockPrisma.aICache.deleteMany.mockResolvedValue({ count: 1 });

      await invalidateCache("ticket-1");

      expect(mockPrisma.aICache.deleteMany).toHaveBeenCalledWith({
        where: { ticketId: "ticket-1" },
      });
    });
  });
});
