import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, AIStreamChunk } from "./types";
import { SYSTEM_PROMPT, buildUserPrompt, parseAIResult } from "./prompt";

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private model: string;

  constructor({ apiKey, model }: { apiKey: string; model: string }) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async *generateSummary(input: {
    title: string;
    description: string;
  }): AsyncGenerator<AIStreamChunk> {
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(input) }],
      temperature: 0.3,
    });

    let accumulated = "";
    let lastYieldedLength = 0;

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        accumulated += event.delta.text;

        if (accumulated.length - lastYieldedLength >= 50) {
          yield {
            type: "chunk",
            field: "summary",
            content: accumulated.substring(lastYieldedLength),
          };
          lastYieldedLength = accumulated.length;
        }
      }
    }

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
