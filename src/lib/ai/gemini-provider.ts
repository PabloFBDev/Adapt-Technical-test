import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider, AIStreamChunk } from "./types";
import { SYSTEM_PROMPT, buildUserPrompt, parseAIResult } from "./prompt";
import { simulateStream } from "./stream-utils";

export class GeminiProvider implements AIProvider {
  private modelName: string;
  private apiKey: string;

  constructor({ apiKey, model }: { apiKey: string; model: string }) {
    this.apiKey = apiKey;
    this.modelName = model;
  }

  async *generateSummary(input: {
    title: string;
    description: string;
  }): AsyncGenerator<AIStreamChunk> {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({
      model: this.modelName,
      systemInstruction: SYSTEM_PROMPT,
    });

    const response = await model.generateContent(buildUserPrompt(input));
    const text = response.response.text();

    const result = parseAIResult(text);
    yield* simulateStream(result);
  }
}
