import { describe, it, expect, vi } from "vitest";
import { cn, NotFoundError, handleApiError } from "@/lib/utils";
import { ZodError, z } from "zod";

// Mock logger to avoid side effects
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("cn", () => {
  it("should merge class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("should merge tailwind conflicts", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("should handle empty inputs", () => {
    expect(cn()).toBe("");
  });
});

describe("NotFoundError", () => {
  it("should create error with correct name and message", () => {
    const error = new NotFoundError("Ticket not found");
    expect(error.name).toBe("NotFoundError");
    expect(error.message).toBe("Ticket not found");
    expect(error).toBeInstanceOf(Error);
  });
});

describe("handleApiError", () => {
  it("should return 400 for ZodError", async () => {
    const schema = z.object({ name: z.string() });
    let zodError: ZodError;
    try {
      schema.parse({ name: 123 });
    } catch (e) {
      zodError = e as ZodError;
    }

    const response = handleApiError(zodError!);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe("Validation failed");
    expect(body.details).toBeDefined();
  });

  it("should return 404 for NotFoundError", async () => {
    const error = new NotFoundError("Ticket not found");
    const response = handleApiError(error);
    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.error).toBe("Ticket not found");
  });

  it("should return 500 for generic Error", async () => {
    const error = new Error("Something broke");
    const response = handleApiError(error);
    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body.error).toBe("Internal server error");
  });

  it("should return 500 for non-Error values", async () => {
    const response = handleApiError("string error");
    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body.error).toBe("Internal server error");
  });
});
