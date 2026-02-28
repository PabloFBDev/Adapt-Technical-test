import type { AIProvider } from "./types";
import { MockAIProvider } from "./mock-provider";

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER;

  switch (provider) {
    // Future providers: case "openai": return new OpenAIProvider();
    default:
      return new MockAIProvider();
  }
}
