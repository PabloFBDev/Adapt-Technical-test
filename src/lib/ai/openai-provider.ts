import OpenAI from "openai";
import type { AIProvider, AIStreamChunk } from "./types";
import { SYSTEM_PROMPT, buildUserPrompt, parseAIResult } from "./prompt";
import { simulateStream } from "./stream-utils";

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor({ apiKey, model }: { apiKey: string; model: string }) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async *generateSummary(input: {
    title: string;
    description: string;
  }): AsyncGenerator<AIStreamChunk> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input) },
      ],
      temperature: 0.3,
    });

    const text = completion.choices[0]?.message?.content ?? "";
    const result = parseAIResult(text);
    yield* simulateStream(result);
  }
}
