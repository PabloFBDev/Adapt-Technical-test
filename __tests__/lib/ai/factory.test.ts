import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AISettings } from "@/lib/ai/settings";
import { AIProviderError } from "@/lib/ai/errors";

vi.mock("@/lib/ai/mock-provider", () => {
  const MockAIProvider = vi.fn().mockImplementation(function () {
    return { generateSummary: vi.fn() };
  });
  return { MockAIProvider };
});

vi.mock("@/lib/ai/openai-provider", () => {
  const OpenAIProvider = vi.fn().mockImplementation(function () {
    return { generateSummary: vi.fn() };
  });
  return { OpenAIProvider };
});

vi.mock("@/lib/ai/anthropic-provider", () => {
  const AnthropicProvider = vi.fn().mockImplementation(function () {
    return { generateSummary: vi.fn() };
  });
  return { AnthropicProvider };
});

vi.mock("@/lib/ai/gemini-provider", () => {
  const GeminiProvider = vi.fn().mockImplementation(function () {
    return { generateSummary: vi.fn() };
  });
  return { GeminiProvider };
});

import { getAIProvider, getAvailableProviders } from "@/lib/ai/factory";
import { MockAIProvider } from "@/lib/ai/mock-provider";
import { OpenAIProvider } from "@/lib/ai/openai-provider";
import { AnthropicProvider } from "@/lib/ai/anthropic-provider";
import { GeminiProvider } from "@/lib/ai/gemini-provider";

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

  it("should create OpenAIProvider when API key is present", () => {
    const provider = getAIProvider({ ...defaultSettings, openaiApiKey: "sk-test" }, "openai");
    expect(OpenAIProvider).toHaveBeenCalledWith({ apiKey: "sk-test", model: "gpt-4o-mini" });
    expect(provider).toBeDefined();
  });

  it("should create AnthropicProvider when API key is present", () => {
    const provider = getAIProvider({ ...defaultSettings, anthropicApiKey: "ant-key" }, "anthropic");
    expect(AnthropicProvider).toHaveBeenCalledWith({ apiKey: "ant-key", model: "claude-haiku-4-5-20251001" });
    expect(provider).toBeDefined();
  });

  it("should create GeminiProvider when API key is present", () => {
    const provider = getAIProvider({ ...defaultSettings, geminiApiKey: "gem-key" }, "gemini");
    expect(GeminiProvider).toHaveBeenCalledWith({ apiKey: "gem-key", model: "gemini-2.0-flash" });
    expect(provider).toBeDefined();
  });

  it("should use explicit provider parameter over defaultProvider", () => {
    // Passing "mock" explicitly should use mock even if default is different
    const provider = getAIProvider({ ...defaultSettings, defaultProvider: "openai", openaiApiKey: "key" }, "mock");
    expect(MockAIProvider).toHaveBeenCalled();
    expect(provider).toBeDefined();
  });
});

describe("getAvailableProviders", () => {
  it("should always include mock", () => {
    const providers = getAvailableProviders(defaultSettings);
    expect(providers).toContain("mock");
  });

  it("should only return mock when no API keys are set", () => {
    const providers = getAvailableProviders(defaultSettings);
    expect(providers).toEqual(["mock"]);
  });

  it("should include openai when API key is set", () => {
    const providers = getAvailableProviders({ ...defaultSettings, openaiApiKey: "sk-test" });
    expect(providers).toContain("openai");
  });

  it("should include anthropic when API key is set", () => {
    const providers = getAvailableProviders({ ...defaultSettings, anthropicApiKey: "ant-key" });
    expect(providers).toContain("anthropic");
  });

  it("should include gemini when API key is set", () => {
    const providers = getAvailableProviders({ ...defaultSettings, geminiApiKey: "gem-key" });
    expect(providers).toContain("gemini");
  });

  it("should include all providers when all keys are set", () => {
    const providers = getAvailableProviders({
      ...defaultSettings,
      openaiApiKey: "sk-test",
      anthropicApiKey: "ant-key",
      geminiApiKey: "gem-key",
    });
    expect(providers).toEqual(["mock", "openai", "anthropic", "gemini"]);
  });
});
