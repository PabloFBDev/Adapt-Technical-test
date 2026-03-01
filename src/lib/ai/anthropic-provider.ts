import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, AIStreamChunk } from "./types";
import { SYSTEM_PROMPT, buildUserPrompt, parseAIResult } from "./prompt";
import { simulateStream } from "./stream-utils";

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
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(input) }],
      temperature: 0.3,
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const result = parseAIResult(text);
    yield* simulateStream(result);
  }
}
