import { describe, it, expect } from "vitest";
import { chunkText, simulateStream } from "@/lib/ai/stream-utils";
import type { AIResult, AIStreamChunk } from "@/lib/ai/types";

describe("chunkText", () => {
  it("should split text into chunks of the specified word count", () => {
    const text = "one two three four five six seven";
    const chunks = chunkText(text, 3);
    expect(chunks).toEqual(["one two three", "four five six", "seven"]);
  });

  it("should return the full text as one chunk when wordsPerChunk exceeds word count", () => {
    const text = "hello world";
    const chunks = chunkText(text, 10);
    expect(chunks).toEqual(["hello world"]);
  });
});

describe("simulateStream", () => {
  const mockResult: AIResult = {
    summary: "This is a test summary with enough words to make multiple chunks for streaming.",
    nextSteps: ["Step one", "Step two"],
    riskLevel: "high",
    categories: ["bug", "security"],
  };

  async function collectChunks(result: AIResult): Promise<AIStreamChunk[]> {
    const chunks: AIStreamChunk[] = [];
    for await (const chunk of simulateStream(result)) {
      chunks.push(chunk);
    }
    return chunks;
  }

  it("should emit chunks in order: summary → nextSteps → riskLevel → categories → done", async () => {
    const chunks = await collectChunks(mockResult);
    const fields: string[] = [];

    for (const chunk of chunks) {
      if (chunk.type === "chunk") {
        if (!fields.includes(chunk.field)) {
          fields.push(chunk.field);
        }
      } else if (chunk.type === "done") {
        fields.push("done");
      }
    }

    expect(fields).toEqual(["summary", "nextSteps", "riskLevel", "categories", "done"]);
  });

  it("should reconstruct the original summary by joining summary chunks with spaces", async () => {
    const chunks = await collectChunks(mockResult);
    const summaryChunks = chunks
      .filter((c) => c.type === "chunk" && c.field === "summary")
      .map((c) => (c.type === "chunk" ? c.content : ""));
    const reconstructed = summaryChunks.join(" ");
    expect(reconstructed).toBe(mockResult.summary);
  });

  it("should emit one chunk per nextStep", async () => {
    const chunks = await collectChunks(mockResult);
    const stepChunks = chunks.filter(
      (c) => c.type === "chunk" && c.field === "nextSteps"
    );
    expect(stepChunks).toHaveLength(mockResult.nextSteps.length);
  });

  it("should include the complete AIResult in the done chunk", async () => {
    const chunks = await collectChunks(mockResult);
    const done = chunks.find((c) => c.type === "done");
    expect(done).toBeDefined();
    if (done && done.type === "done") {
      expect(done.result).toEqual(mockResult);
    }
  });
});
