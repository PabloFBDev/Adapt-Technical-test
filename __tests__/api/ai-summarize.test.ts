import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/ai/summarize/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

vi.mock("@/lib/ai/settings", () => ({
  getAISettings: vi.fn().mockResolvedValue({
    defaultProvider: "mock",
    openaiApiKey: null,
    openaiModel: "gpt-4o-mini",
    anthropicApiKey: null,
    anthropicModel: "claude-haiku-4-5-20251001",
    geminiApiKey: null,
    geminiModel: "gemini-2.0-flash",
    cacheTtlMs: 3600000,
  }),
}));

vi.mock("@/lib/ai/factory", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/ai/factory")>();
  return {
    ...original,
    getAIProvider: vi.fn(original.getAIProvider),
  };
});

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

  it("should return 422 when provider API key is missing", async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, expires: "" });
    mockPrisma.aICache.findUnique.mockResolvedValue(null);
    mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket as never);

    const { getAIProvider } = await import("@/lib/ai/factory");
    const { AIProviderError } = await import("@/lib/ai/errors");
    vi.mocked(getAIProvider).mockImplementationOnce(() => {
      throw new AIProviderError("Chave de API do OpenAI não configurada.");
    });

    const request = new Request("http://localhost/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: "ticket-1", provider: "openai" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(422);

    const data = await response.json();
    expect(data.error).toContain("OpenAI");
  });

  it("should re-throw non-AIProviderError from getAIProvider as 500", async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, expires: "" });
    mockPrisma.aICache.findUnique.mockResolvedValue(null);
    mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket as never);

    const { getAIProvider } = await import("@/lib/ai/factory");
    vi.mocked(getAIProvider).mockImplementationOnce(() => {
      throw new Error("Unexpected internal error");
    });

    const request = new Request("http://localhost/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: "ticket-1" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });

  it("should skip cache when explicit provider is specified", async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, expires: "" });
    mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket as never);
    mockPrisma.aICache.upsert.mockResolvedValue({} as never);

    // Restore the real getAIProvider for this test
    const originalFactory = await vi.importActual<typeof import("@/lib/ai/factory")>("@/lib/ai/factory");
    const { getAIProvider } = await import("@/lib/ai/factory");
    vi.mocked(getAIProvider).mockImplementation(originalFactory.getAIProvider);

    const request = new Request("http://localhost/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: "ticket-1", provider: "mock" }),
    });

    const response = await POST(request);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");

    // Cache should NOT have been checked (findUnique for aICache not called)
    expect(mockPrisma.aICache.findUnique).not.toHaveBeenCalled();
  });

  it("should emit error SSE event when stream fails", async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, expires: "" });
    mockPrisma.aICache.findUnique.mockResolvedValue(null);
    mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket as never);

    // Mock provider that throws during generateSummary
    const { getAIProvider } = await import("@/lib/ai/factory");
    vi.mocked(getAIProvider).mockReturnValueOnce({
      async *generateSummary() {
        throw new Error("Connection failed");
      },
    });

    vi.spyOn(console, "error").mockImplementation(() => {});

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

    // Should contain an error event
    expect(fullText).toContain('"type":"error"');
  });

  it("should emit error SSE event on stream timeout", async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, expires: "" });
    mockPrisma.aICache.findUnique.mockResolvedValue(null);
    mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket as never);

    // Mock provider that hangs forever (simulating a timeout)
    const { getAIProvider } = await import("@/lib/ai/factory");
    vi.mocked(getAIProvider).mockReturnValueOnce({
      async *generateSummary() {
        // Yield one chunk then hang forever
        yield { type: "chunk" as const, field: "summary" as const, content: "Starting..." };
        await new Promise(() => {}); // never resolves
      },
    });

    vi.spyOn(console, "error").mockImplementation(() => {});

    // Use fake timers to avoid waiting 30s
    vi.useFakeTimers();

    const request = new Request("http://localhost/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: "ticket-1" }),
    });

    const response = await POST(request);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    // Read the first chunk
    const firstRead = await reader.read();
    fullText += decoder.decode(firstRead.value, { stream: true });

    // Advance timer past the 30s timeout
    await vi.advanceTimersByTimeAsync(31_000);

    // Read remaining data
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += decoder.decode(value, { stream: true });
    }

    expect(fullText).toContain('"type":"error"');
    expect(fullText).toContain("tempo limite");

    vi.useRealTimers();
  });
});
