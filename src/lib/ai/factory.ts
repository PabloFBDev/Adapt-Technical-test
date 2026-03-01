import type { AIProvider } from "./types";
import type { AISettings } from "./settings";
import { MockAIProvider } from "./mock-provider";
import { OpenAIProvider } from "./openai-provider";
import { AnthropicProvider } from "./anthropic-provider";
import { GeminiProvider } from "./gemini-provider";

export function getAvailableProviders(settings: AISettings): string[] {
  const providers: string[] = ["mock"];

  if (settings.openaiApiKey) providers.push("openai");
  if (settings.anthropicApiKey) providers.push("anthropic");
  if (settings.geminiApiKey) providers.push("gemini");

  return providers;
}

export function getAIProvider(
  settings: AISettings,
  provider?: string,
): AIProvider {
  const selected = provider || settings.defaultProvider;

  switch (selected) {
    case "openai":
      return new OpenAIProvider({
        apiKey: settings.openaiApiKey || "",
        model: settings.openaiModel,
      });
    case "anthropic":
      return new AnthropicProvider({
        apiKey: settings.anthropicApiKey || "",
        model: settings.anthropicModel,
      });
    case "gemini":
      return new GeminiProvider({
        apiKey: settings.geminiApiKey || "",
        model: settings.geminiModel,
      });
    default:
      return new MockAIProvider();
  }
}
