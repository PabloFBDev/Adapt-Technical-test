import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/tickets/route";
import { GET as GET_DETAIL, PATCH } from "@/app/api/tickets/[id]/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

const mockPrisma = vi.mocked(prisma);
const mockGetSession = vi.mocked(getServerSession);

const mockUser = { id: "user-1", email: "admin@opscopilot.com", name: "Admin" };
const mockTicket = {
  id: "ticket-1",
  title: "Test ticket",
  description: "A test ticket with enough description text.",
  status: "open" as const,
  priority: "medium" as const,
  tags: ["test"],
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: "user-1",
  user: mockUser,
};

describe("GET /api/tickets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return paginated list of tickets", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([mockTicket]);
    mockPrisma.ticket.count.mockResolvedValue(1);

    const request = new Request("http://localhost/api/tickets");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("pagination");
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(10);
    expect(data.pagination.total).toBe(1);
  });

  it("should filter by status", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([]);
    mockPrisma.ticket.count.mockResolvedValue(0);

    const request = new Request("http://localhost/api/tickets?status=open");
    await GET(request);

    expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "open" }),
      })
    );
  });

  it("should search by title/description", async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([]);
    mockPrisma.ticket.count.mockResolvedValue(0);

    const request = new Request("http://localhost/api/tickets?search=bug");
    await GET(request);

    expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ title: expect.objectContaining({ contains: "bug" }) }),
          ]),
        }),
      })
    );
  });
});

describe("POST /api/tickets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a ticket and return 201", async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, expires: "" });
    mockPrisma.ticket.create.mockResolvedValue(mockTicket);
    mockPrisma.auditLog.create.mockResolvedValue({} as never);

    const request = new Request("http://localhost/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "New ticket",
        description: "A description with enough characters for validation.",
        priority: "high",
        tags: ["urgent"],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data).toHaveProperty("data");
  });

  it("should return 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const request = new Request("http://localhost/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "New ticket",
        description: "A description with enough characters.",
        priority: "high",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("should return 400 with invalid input", async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, expires: "" });

    const request = new Request("http://localhost/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Ab",
        description: "Short",
        priority: "invalid",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty("error", "Validation failed");
    expect(data).toHaveProperty("details");
  });
});

describe("GET /api/tickets/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return ticket details", async () => {
    mockPrisma.ticket.findUnique.mockResolvedValue({
      ...mockTicket,
      auditLogs: [],
      aiCache: null,
    } as never);

    const request = new Request("http://localhost/api/tickets/ticket-1");
    const response = await GET_DETAIL(request, {
      params: Promise.resolve({ id: "ticket-1" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.id).toBe("ticket-1");
  });

  it("should return 404 for non-existent ticket", async () => {
    mockPrisma.ticket.findUnique.mockResolvedValue(null);

    const request = new Request("http://localhost/api/tickets/non-existent");
    const response = await GET_DETAIL(request, {
      params: Promise.resolve({ id: "non-existent" }),
    });

    expect(response.status).toBe(404);
  });
});

describe("PATCH /api/tickets/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update ticket and create audit log", async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, expires: "" });
    mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket as never);
    mockPrisma.ticket.update.mockResolvedValue({
      ...mockTicket,
      status: "in_progress",
    } as never);
    mockPrisma.auditLog.create.mockResolvedValue({} as never);

    const request = new Request("http://localhost/api/tickets/ticket-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "in_progress" }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "ticket-1" }),
    });

    expect(response.status).toBe(200);
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "status_changed",
          changes: expect.objectContaining({
            status: { from: "open", to: "in_progress" },
          }),
        }),
      })
    );
  });

  it("should not create audit log when nothing changed", async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, expires: "" });
    mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket as never);

    const request = new Request("http://localhost/api/tickets/ticket-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: mockTicket.title }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "ticket-1" }),
    });

    expect(response.status).toBe(200);
    expect(mockPrisma.auditLog.create).not.toHaveBeenCalled();
  });

  it("should return 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const request = new Request("http://localhost/api/tickets/ticket-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "ticket-1" }),
    });

    expect(response.status).toBe(401);
  });
});
