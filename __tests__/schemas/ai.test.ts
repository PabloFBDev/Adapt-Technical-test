import { describe, it, expect } from "vitest";
import { summarizeSchema } from "@/schemas/ai";

describe("summarizeSchema", () => {
  it("should accept ticketId input", () => {
    const result = summarizeSchema.safeParse({ ticketId: "clx123abc" });
    expect(result.success).toBe(true);
  });

  it("should accept title + description input", () => {
    const result = summarizeSchema.safeParse({
      title: "Bug in login",
      description: "Users cannot log in after the update was applied.",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty ticketId", () => {
    const result = summarizeSchema.safeParse({ ticketId: "" });
    expect(result.success).toBe(false);
  });

  it("should reject title shorter than 3 characters", () => {
    const result = summarizeSchema.safeParse({
      title: "AB",
      description: "Valid description with more than 10 characters.",
    });
    expect(result.success).toBe(false);
  });

  it("should reject description shorter than 10 characters", () => {
    const result = summarizeSchema.safeParse({
      title: "Valid title",
      description: "Short",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty object", () => {
    const result = summarizeSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("should reject object with only title (no description)", () => {
    const result = summarizeSchema.safeParse({
      title: "Valid title",
    });
    expect(result.success).toBe(false);
  });
});
