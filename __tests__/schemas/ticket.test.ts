import { describe, it, expect } from "vitest";
import {
  createTicketSchema,
  updateTicketSchema,
  ticketQuerySchema,
} from "@/schemas/ticket";

describe("createTicketSchema", () => {
  it("should accept valid input", () => {
    const result = createTicketSchema.safeParse({
      title: "Valid title",
      description: "This is a valid description with enough characters.",
      priority: "medium",
      tags: ["bug", "frontend"],
    });
    expect(result.success).toBe(true);
  });

  it("should accept input without tags (defaults to empty array)", () => {
    const result = createTicketSchema.safeParse({
      title: "Valid title",
      description: "This is a valid description with enough characters.",
      priority: "low",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual([]);
    }
  });

  it("should reject title shorter than 3 characters", () => {
    const result = createTicketSchema.safeParse({
      title: "Ab",
      description: "This is a valid description with enough characters.",
      priority: "high",
    });
    expect(result.success).toBe(false);
  });

  it("should reject title longer than 120 characters", () => {
    const result = createTicketSchema.safeParse({
      title: "A".repeat(121),
      description: "This is a valid description with enough characters.",
      priority: "high",
    });
    expect(result.success).toBe(false);
  });

  it("should reject description shorter than 10 characters", () => {
    const result = createTicketSchema.safeParse({
      title: "Valid title",
      description: "Short",
      priority: "medium",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid priority", () => {
    const result = createTicketSchema.safeParse({
      title: "Valid title",
      description: "This is a valid description with enough characters.",
      priority: "urgent",
    });
    expect(result.success).toBe(false);
  });

  it("should reject more than 10 tags", () => {
    const result = createTicketSchema.safeParse({
      title: "Valid title",
      description: "This is a valid description with enough characters.",
      priority: "medium",
      tags: Array.from({ length: 11 }, (_, i) => `tag${i}`),
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty tag strings", () => {
    const result = createTicketSchema.safeParse({
      title: "Valid title",
      description: "This is a valid description with enough characters.",
      priority: "medium",
      tags: [""],
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing required fields", () => {
    const result = createTicketSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("updateTicketSchema", () => {
  it("should accept partial updates", () => {
    const result = updateTicketSchema.safeParse({
      title: "Updated title",
    });
    expect(result.success).toBe(true);
  });

  it("should accept status update", () => {
    const result = updateTicketSchema.safeParse({
      status: "in_progress",
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty object (no changes)", () => {
    const result = updateTicketSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should reject invalid status", () => {
    const result = updateTicketSchema.safeParse({
      status: "cancelled",
    });
    expect(result.success).toBe(false);
  });

  it("should reject title shorter than 3 characters", () => {
    const result = updateTicketSchema.safeParse({
      title: "Ab",
    });
    expect(result.success).toBe(false);
  });
});

describe("ticketQuerySchema", () => {
  it("should apply defaults for empty query", () => {
    const result = ticketQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(10);
      expect(result.data.sortBy).toBe("createdAt");
      expect(result.data.order).toBe("desc");
    }
  });

  it("should coerce string page to number", () => {
    const result = ticketQuerySchema.safeParse({ page: "3" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
    }
  });

  it("should accept valid filter values", () => {
    const result = ticketQuerySchema.safeParse({
      status: "open",
      priority: "high",
      search: "bug",
      sortBy: "updatedAt",
      order: "asc",
    });
    expect(result.success).toBe(true);
  });

  it("should reject limit greater than 50", () => {
    const result = ticketQuerySchema.safeParse({ limit: 100 });
    expect(result.success).toBe(false);
  });

  it("should reject negative page", () => {
    const result = ticketQuerySchema.safeParse({ page: -1 });
    expect(result.success).toBe(false);
  });
});
