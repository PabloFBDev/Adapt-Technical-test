import { describe, it, expect } from "vitest";
import { SYSTEM_PROMPT, buildUserPrompt, parseAIResult } from "@/lib/ai/prompt";

describe("SYSTEM_PROMPT", () => {
  it("should be a non-empty string", () => {
    expect(typeof SYSTEM_PROMPT).toBe("string");
    expect(SYSTEM_PROMPT.length).toBeGreaterThan(0);
  });

  it("should mention JSON output format", () => {
    expect(SYSTEM_PROMPT).toContain("JSON");
  });

  it("should mention required fields", () => {
    expect(SYSTEM_PROMPT).toContain("summary");
    expect(SYSTEM_PROMPT).toContain("nextSteps");
    expect(SYSTEM_PROMPT).toContain("riskLevel");
    expect(SYSTEM_PROMPT).toContain("categories");
  });
});

describe("buildUserPrompt", () => {
  it("should format title and description", () => {
    const result = buildUserPrompt({ title: "Bug report", description: "App crashes on login" });
    expect(result).toBe("Ticket Title: Bug report\n\nTicket Description: App crashes on login");
  });

  it("should handle empty strings", () => {
    const result = buildUserPrompt({ title: "", description: "" });
    expect(result).toBe("Ticket Title: \n\nTicket Description: ");
  });
});

describe("parseAIResult", () => {
  it("should parse valid JSON response", () => {
    const json = JSON.stringify({
      summary: "This is a bug",
      nextSteps: ["Fix it", "Test it"],
      riskLevel: "high",
      categories: ["bug"],
    });

    const result = parseAIResult(json);
    expect(result.summary).toBe("This is a bug");
    expect(result.nextSteps).toEqual(["Fix it", "Test it"]);
    expect(result.riskLevel).toBe("high");
    expect(result.categories).toEqual(["bug"]);
  });

  it("should extract JSON from markdown fenced code blocks", () => {
    const text = '```json\n{"summary":"Test","nextSteps":["Step 1"],"riskLevel":"low","categories":["task"]}\n```';

    const result = parseAIResult(text);
    expect(result.summary).toBe("Test");
    expect(result.riskLevel).toBe("low");
  });

  it("should return defaults when summary is not a string", () => {
    const json = JSON.stringify({
      summary: 123,
      nextSteps: ["Step"],
      riskLevel: "high",
      categories: ["bug"],
    });

    const result = parseAIResult(json);
    expect(result.summary).toBe("Não foi possível gerar o resumo.");
  });

  it("should return default nextSteps when not an array", () => {
    const json = JSON.stringify({
      summary: "Test",
      nextSteps: "not an array",
      riskLevel: "low",
      categories: ["task"],
    });

    const result = parseAIResult(json);
    expect(result.nextSteps).toEqual(["Revisar os detalhes do ticket."]);
  });

  it("should filter non-string items from nextSteps", () => {
    const json = JSON.stringify({
      summary: "Test",
      nextSteps: ["Valid", 123, "Also valid", null],
      riskLevel: "low",
      categories: ["task"],
    });

    const result = parseAIResult(json);
    expect(result.nextSteps).toEqual(["Valid", "Also valid"]);
  });

  it("should default riskLevel to medium for invalid values", () => {
    const json = JSON.stringify({
      summary: "Test",
      nextSteps: ["Step"],
      riskLevel: "critical",
      categories: ["bug"],
    });

    const result = parseAIResult(json);
    expect(result.riskLevel).toBe("medium");
  });

  it("should return default categories when not an array", () => {
    const json = JSON.stringify({
      summary: "Test",
      nextSteps: ["Step"],
      riskLevel: "low",
      categories: "not an array",
    });

    const result = parseAIResult(json);
    expect(result.categories).toEqual(["task"]);
  });

  it("should return fallback result for completely invalid text", () => {
    const result = parseAIResult("this is not json at all");
    expect(result.summary).toContain("Não foi possível interpretar");
    expect(result.nextSteps).toEqual(["Revisar os detalhes do ticket e confirmar o escopo."]);
    expect(result.riskLevel).toBe("medium");
    expect(result.categories).toEqual(["task"]);
  });

  it("should return fallback result for empty string", () => {
    const result = parseAIResult("");
    expect(result.summary).toContain("Não foi possível interpretar");
  });

  it("should handle JSON with extra text around it", () => {
    const text = 'Here is the analysis:\n{"summary":"Found it","nextSteps":["Go"],"riskLevel":"high","categories":["bug"]}\nEnd.';

    const result = parseAIResult(text);
    expect(result.summary).toBe("Found it");
    expect(result.riskLevel).toBe("high");
  });
});
