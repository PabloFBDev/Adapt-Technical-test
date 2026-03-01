import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider, AIStreamChunk } from "./types";
import { SYSTEM_PROMPT, buildUserPrompt, parseAIResult } from "./prompt";

export class GeminiProvider implements AIProvider {
  private model: string;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || "";
    this.model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  }

  async *generateSummary(input: {
    title: string;
    description: string;
  }): AsyncGenerator<AIStreamChunk> {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({
      model: this.model,
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContentStream(buildUserPrompt(input));

    let accumulated = "";
    let lastYieldedLength = 0;

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (!text) continue;

      accumulated += text;

      if (accumulated.length - lastYieldedLength >= 50) {
        yield {
          type: "chunk",
          field: "summary",
          content: accumulated.substring(lastYieldedLength),
        };
        lastYieldedLength = accumulated.length;
      }
    }

    if (accumulated.length > lastYieldedLength) {
      yield {
        type: "chunk",
        field: "summary",
        content: accumulated.substring(lastYieldedLength),
      };
    }

    const parsed = parseAIResult(accumulated);

    yield { type: "done", result: parsed };
  }
}
