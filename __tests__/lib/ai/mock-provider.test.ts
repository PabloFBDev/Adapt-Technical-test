import { describe, it, expect } from "vitest";
import { MockAIProvider } from "@/lib/ai/mock-provider";
import type { AIResult, AIStreamChunk } from "@/lib/ai/types";

describe("MockAIProvider", () => {
  const provider = new MockAIProvider();

  async function collectChunks(
    input: { title: string; description: string }
  ): Promise<AIStreamChunk[]> {
    const chunks: AIStreamChunk[] = [];
    for await (const chunk of provider.generateSummary(input)) {
      chunks.push(chunk);
    }
    return chunks;
  }

  function getDoneResult(chunks: AIStreamChunk[]): AIResult {
    const done = chunks.find((c) => c.type === "done");
    if (!done || done.type !== "done") throw new Error("No done chunk");
    return done.result;
  }

  it("should return a valid AIResult with all required fields", async () => {
    const chunks = await collectChunks({
      title: "Test ticket",
      description: "This is a test description for the ticket system.",
    });

    const result = getDoneResult(chunks);

    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("nextSteps");
    expect(result).toHaveProperty("riskLevel");
    expect(result).toHaveProperty("categories");

    expect(typeof result.summary).toBe("string");
    expect(result.summary.length).toBeGreaterThan(0);
    expect(Array.isArray(result.nextSteps)).toBe(true);
    expect(result.nextSteps.length).toBeGreaterThanOrEqual(3);
    expect(["low", "medium", "high"]).toContain(result.riskLevel);
    expect(Array.isArray(result.categories)).toBe(true);
    expect(result.categories.length).toBeGreaterThan(0);
  });

  it("should emit chunks in the correct streaming format", async () => {
    const chunks = await collectChunks({
      title: "Test ticket",
      description: "This is a test description for the ticket system.",
    });

    // Should have at least summary chunks, nextSteps chunks, riskLevel, categories, and done
    expect(chunks.length).toBeGreaterThanOrEqual(5);

    // All chunks should have valid type
    for (const chunk of chunks) {
      expect(["chunk", "done"]).toContain(chunk.type);
    }

    // Last chunk should be "done"
    expect(chunks[chunks.length - 1].type).toBe("done");

    // Non-done chunks should have field and content
    const streamChunks = chunks.filter((c) => c.type === "chunk");
    for (const chunk of streamChunks) {
      if (chunk.type === "chunk") {
        expect(["summary", "nextSteps", "riskLevel", "categories"]).toContain(
          chunk.field
        );
        expect(typeof chunk.content).toBe("string");
      }
    }
  });

  it("should classify bug-related tickets as high risk", async () => {
    const chunks = await collectChunks({
      title: "Critical bug in authentication",
      description: "Users are unable to log in after the latest update.",
    });

    const result = getDoneResult(chunks);
    expect(result.riskLevel).toBe("high");
    expect(result.categories).toContain("bug");
  });

  it("should classify error-related tickets as high risk", async () => {
    const chunks = await collectChunks({
      title: "Error 500 on production server",
      description: "The production server is returning 500 errors intermittently.",
    });

    const result = getDoneResult(chunks);
    expect(result.riskLevel).toBe("high");
    expect(result.categories).toContain("bug");
  });

  it("should classify feature requests as low risk", async () => {
    const chunks = await collectChunks({
      title: "Feature request: dark mode",
      description: "Users have requested a dark mode option for the application.",
    });

    const result = getDoneResult(chunks);
    expect(result.riskLevel).toBe("low");
    expect(result.categories).toContain("feature");
  });

  it("should classify generic tickets as medium risk with task category", async () => {
    const chunks = await collectChunks({
      title: "Update documentation",
      description: "We need to update the project documentation with the latest changes.",
    });

    const result = getDoneResult(chunks);
    expect(result.riskLevel).toBe("medium");
    expect(result.categories).toContain("task");
  });

  it("should classify security-related tickets as high risk", async () => {
    const chunks = await collectChunks({
      title: "Update dependencies",
      description: "There is a security vulnerability in one of our dependencies.",
    });

    const result = getDoneResult(chunks);
    expect(result.riskLevel).toBe("high");
    expect(result.categories).toContain("security");
  });

  it("should have summary chunks that form the complete summary", async () => {
    const chunks = await collectChunks({
      title: "Test ticket",
      description: "This is a test description for the ticket system.",
    });

    const summaryChunks = chunks
      .filter((c) => c.type === "chunk" && c.field === "summary")
      .map((c) => (c.type === "chunk" ? c.content : ""));
    const reconstructedSummary = summaryChunks.join(" ");

    const result = getDoneResult(chunks);
    expect(reconstructedSummary).toBe(result.summary);
  });
});
