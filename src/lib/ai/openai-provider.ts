import OpenAI from "openai";
import type { AIProvider, AIStreamChunk } from "./types";
import { SYSTEM_PROMPT, buildUserPrompt, parseAIResult } from "./prompt";

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  }

  async *generateSummary(input: {
    title: string;
    description: string;
  }): AsyncGenerator<AIStreamChunk> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input) },
      ],
      temperature: 0.3,
    });

    let accumulated = "";
    let lastYieldedLength = 0;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (!delta) continue;

      accumulated += delta;

      // Yield summary chunks progressively (every ~50 chars)
      if (accumulated.length - lastYieldedLength >= 50) {
        yield {
          type: "chunk",
          field: "summary",
          content: accumulated.substring(lastYieldedLength),
        };
        lastYieldedLength = accumulated.length;
      }
    }

    // Yield any remaining text
    if (accumulated.length > lastYieldedLength) {
      yield {
        type: "chunk",
        field: "summary",
        content: accumulated.substring(lastYieldedLength),
      };
    }

    const result = parseAIResult(accumulated);

    yield { type: "done", result };
  }
}
