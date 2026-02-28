import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/ai/summarize/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

const mockPrisma = vi.mocked(prisma);
const mockGetSession = vi.mocked(getServerSession);

const mockUser = { id: "user-1", email: "admin@opscopilot.com", name: "Admin" };
const mockTicket = {
  id: "ticket-1",
  title: "Bug in authentication",
  description: "Users cannot log in after the update was applied to the system.",
  status: "open" as const,
  priority: "high" as const,
  tags: ["bug"],
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: "user-1",
};

describe("POST /api/ai/summarize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const request = new Request("http://localhost/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: "ticket-1" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("should return cached result when cache is valid", async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, expires: "" });
    const cachedResult = {
      summary: "Cached summary",
      nextSteps: ["Step 1"],
      riskLevel: "high",
      categories: ["bug"],
    };

    mockPrisma.aICache.findUnique.mockResolvedValue({
      id: "cache-1",
      ticketId: "ticket-1",
      result: cachedResult as unknown as Record<string, unknown>,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    });

    const request = new Request("http://localhost/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: "ticket-1" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.cached).toBe(true);
    expect(data.data).toEqual(cachedResult);
  });

  it("should return 404 for non-existent ticket", async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, expires: "" });
    mockPrisma.aICache.findUnique.mockResolvedValue(null);
    mockPrisma.ticket.findUnique.mockResolvedValue(null);

    const request = new Request("http://localhost/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: "non-existent" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
  });

  it("should return SSE stream for valid ticket without cache", async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, expires: "" });
    mockPrisma.aICache.findUnique.mockResolvedValue(null);
    mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket as never);
    mockPrisma.aICache.upsert.mockResolvedValue({} as never);

    const request = new Request("http://localhost/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: "ticket-1" }),
    });

    const response = await POST(request);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");

    // Read the stream
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += decoder.decode(value, { stream: true });
    }

    // Should contain SSE events
    expect(fullText).toContain("data: ");
    // Should contain a done event with full result
    expect(fullText).toContain('"type":"done"');
  });

  it("should return SSE stream for title + description input", async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, expires: "" });

    const request = new Request("http://localhost/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Feature request: dark mode",
        description: "Users want dark mode support in the application dashboard.",
      }),
    });

    const response = await POST(request);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
  });

  it("should return 400 for invalid input", async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, expires: "" });

    const request = new Request("http://localhost/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
