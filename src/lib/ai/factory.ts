import type { AIProvider } from "./types";
import { MockAIProvider } from "./mock-provider";
import { OpenAIProvider } from "./openai-provider";
import { AnthropicProvider } from "./anthropic-provider";
import { GeminiProvider } from "./gemini-provider";

const PROVIDER_KEY_MAP: Record<string, string | null> = {
  mock: null,
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  gemini: "GEMINI_API_KEY",
};

export function getAvailableProviders(): string[] {
  return Object.entries(PROVIDER_KEY_MAP)
    .filter(([, envVar]) => envVar === null || !!process.env[envVar])
    .map(([name]) => name);
}

export function getAIProvider(provider?: string): AIProvider {
  const selected = provider || process.env.AI_PROVIDER;

  switch (selected) {
    case "openai":
      return new OpenAIProvider();
    case "anthropic":
      return new AnthropicProvider();
    case "gemini":
      return new GeminiProvider();
    default:
      return new MockAIProvider();
  }
}
