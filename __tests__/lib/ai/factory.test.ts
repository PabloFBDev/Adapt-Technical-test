import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AISettings } from "@/lib/ai/settings";
import { AIProviderError } from "@/lib/ai/errors";

vi.mock("@/lib/ai/mock-provider", () => {
  const MockAIProvider = vi.fn().mockImplementation(function () {
    return { generateSummary: vi.fn() };
  });
  return { MockAIProvider };
});

import { getAIProvider } from "@/lib/ai/factory";
import { MockAIProvider } from "@/lib/ai/mock-provider";

const defaultSettings: AISettings = {
  defaultProvider: "mock",
  openaiApiKey: null,
  openaiModel: "gpt-4o-mini",
  anthropicApiKey: null,
  anthropicModel: "claude-haiku-4-5-20251001",
  geminiApiKey: null,
  geminiModel: "gemini-2.0-flash",
  cacheTtlMs: 3600000,
};

describe("getAIProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return MockAIProvider by default", () => {
    const provider = getAIProvider(defaultSettings);
    expect(MockAIProvider).toHaveBeenCalled();
    expect(provider).toBeDefined();
    expect(provider.generateSummary).toBeDefined();
  });

  it("should return MockAIProvider when defaultProvider is 'mock'", () => {
    const provider = getAIProvider({ ...defaultSettings, defaultProvider: "mock" });
    expect(MockAIProvider).toHaveBeenCalled();
    expect(provider).toBeDefined();
  });

  it("should return MockAIProvider for unknown provider", () => {
    const provider = getAIProvider({ ...defaultSettings, defaultProvider: "unknown" });
    expect(MockAIProvider).toHaveBeenCalled();
    expect(provider).toBeDefined();
  });

  it("should throw AIProviderError when OpenAI API key is missing", () => {
    expect(() =>
      getAIProvider({ ...defaultSettings, defaultProvider: "openai" })
    ).toThrow(AIProviderError);
    expect(() =>
      getAIProvider({ ...defaultSettings, defaultProvider: "openai" })
    ).toThrow("Chave de API do OpenAI não configurada");
  });

  it("should throw AIProviderError when Anthropic API key is missing", () => {
    expect(() =>
      getAIProvider({ ...defaultSettings, defaultProvider: "anthropic" })
    ).toThrow(AIProviderError);
    expect(() =>
      getAIProvider({ ...defaultSettings, defaultProvider: "anthropic" })
    ).toThrow("Chave de API do Anthropic não configurada");
  });

  it("should throw AIProviderError when Gemini API key is missing", () => {
    expect(() =>
      getAIProvider({ ...defaultSettings, defaultProvider: "gemini" })
    ).toThrow(AIProviderError);
    expect(() =>
      getAIProvider({ ...defaultSettings, defaultProvider: "gemini" })
    ).toThrow("Chave de API do Gemini não configurada");
  });
});
