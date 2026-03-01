import type { AIResult, AIStreamChunk } from "./types";

export function chunkText(text: string, wordsPerChunk: number): string[] {
  const words = text.split(" ");
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(" "));
  }
  return chunks;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function* simulateStream(
  result: AIResult,
): AsyncGenerator<AIStreamChunk> {
  const summaryChunks = chunkText(result.summary, 10);
  for (const chunk of summaryChunks) {
    yield { type: "chunk", field: "summary", content: chunk };
    await delay(50 + Math.random() * 50);
  }

  for (const step of result.nextSteps) {
    yield { type: "chunk", field: "nextSteps", content: step };
    await delay(80 + Math.random() * 40);
  }

  yield { type: "chunk", field: "riskLevel", content: result.riskLevel };
  yield {
    type: "chunk",
    field: "categories",
    content: JSON.stringify(result.categories),
  };

  yield { type: "done", result };
}
