import type { AIProvider } from "./types";
import type { AISettings } from "./settings";
import { MockAIProvider } from "./mock-provider";
import { OpenAIProvider } from "./openai-provider";
import { AnthropicProvider } from "./anthropic-provider";
import { GeminiProvider } from "./gemini-provider";
import { AIProviderError } from "./errors";

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
      if (!settings.openaiApiKey) {
        throw new AIProviderError("Chave de API do OpenAI não configurada. Adicione em Configurações.");
      }
      return new OpenAIProvider({
        apiKey: settings.openaiApiKey,
        model: settings.openaiModel,
      });
    case "anthropic":
      if (!settings.anthropicApiKey) {
        throw new AIProviderError("Chave de API do Anthropic não configurada. Adicione em Configurações.");
      }
      return new AnthropicProvider({
        apiKey: settings.anthropicApiKey,
        model: settings.anthropicModel,
      });
    case "gemini":
      if (!settings.geminiApiKey) {
        throw new AIProviderError("Chave de API do Gemini não configurada. Adicione em Configurações.");
      }
      return new GeminiProvider({
        apiKey: settings.geminiApiKey,
        model: settings.geminiModel,
      });
    default:
      return new MockAIProvider();
  }
}
