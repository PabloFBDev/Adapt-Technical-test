import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";

// We need to reset the module between tests to clear the in-memory cache
describe("AI Settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear env vars
    delete process.env.AI_PROVIDER;
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MODEL;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_MODEL;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;
    delete process.env.AI_CACHE_TTL_MS;
  });

  describe("maskApiKey", () => {
    it("should return null for null input", async () => {
      const { maskApiKey } = await import("@/lib/ai/settings");
      expect(maskApiKey(null)).toBeNull();
    });

    it("should mask all characters for short keys (<=4)", async () => {
      const { maskApiKey } = await import("@/lib/ai/settings");
      expect(maskApiKey("abc")).toBe("•••");
      expect(maskApiKey("abcd")).toBe("••••");
    });

    it("should show last 4 characters for longer keys", async () => {
      const { maskApiKey } = await import("@/lib/ai/settings");
      expect(maskApiKey("sk-1234567890")).toBe("•••••••••7890");
    });

    it("should return null for empty string", async () => {
      const { maskApiKey } = await import("@/lib/ai/settings");
      // empty string is falsy
      expect(maskApiKey("")).toBeNull();
    });
  });

  describe("getAISettings", () => {
    it("should return default settings when no DB config exists", async () => {
      (prisma.aIConfig.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      // Reset module to clear cache
      vi.resetModules();
      const { getAISettings } = await import("@/lib/ai/settings");

      const settings = await getAISettings();
      expect(settings.defaultProvider).toBe("mock");
      expect(settings.openaiApiKey).toBeNull();
      expect(settings.openaiModel).toBe("gpt-4o-mini");
      expect(settings.anthropicApiKey).toBeNull();
      expect(settings.anthropicModel).toBe("claude-haiku-4-5-20251001");
      expect(settings.geminiApiKey).toBeNull();
      expect(settings.geminiModel).toBe("gemini-2.0-flash");
      expect(settings.cacheTtlMs).toBe(3600000);
    });

    it("should use DB config values when available", async () => {
      (prisma.aIConfig.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "singleton",
        defaultProvider: "openai",
        openaiApiKey: "sk-test",
        openaiModel: "gpt-4",
        anthropicApiKey: "ant-key",
        anthropicModel: "claude-3",
        geminiApiKey: "gem-key",
        geminiModel: "gemini-pro",
        cacheTtlMs: 60000,
      });

      vi.resetModules();
      const { getAISettings } = await import("@/lib/ai/settings");

      const settings = await getAISettings();
      expect(settings.defaultProvider).toBe("openai");
      expect(settings.openaiApiKey).toBe("sk-test");
      expect(settings.openaiModel).toBe("gpt-4");
      expect(settings.anthropicApiKey).toBe("ant-key");
      expect(settings.anthropicModel).toBe("claude-3");
      expect(settings.geminiApiKey).toBe("gem-key");
      expect(settings.geminiModel).toBe("gemini-pro");
      expect(settings.cacheTtlMs).toBe(60000);
    });

    it("should fall back to env vars when DB fields are null", async () => {
      process.env.AI_PROVIDER = "anthropic";
      process.env.OPENAI_API_KEY = "env-openai-key";
      process.env.OPENAI_MODEL = "env-model";

      (prisma.aIConfig.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "singleton",
        defaultProvider: null,
        openaiApiKey: null,
        openaiModel: null,
        anthropicApiKey: null,
        anthropicModel: null,
        geminiApiKey: null,
        geminiModel: null,
        cacheTtlMs: null,
      });

      vi.resetModules();
      const { getAISettings } = await import("@/lib/ai/settings");

      const settings = await getAISettings();
      expect(settings.defaultProvider).toBe("anthropic");
      expect(settings.openaiApiKey).toBe("env-openai-key");
      expect(settings.openaiModel).toBe("env-model");
    });

    it("should use in-memory cache on subsequent calls", async () => {
      (prisma.aIConfig.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      vi.resetModules();
      const { getAISettings } = await import("@/lib/ai/settings");

      await getAISettings();
      await getAISettings();

      // Should only call DB once due to cache
      expect(prisma.aIConfig.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe("invalidateSettingsCache", () => {
    it("should force DB re-read after invalidation", async () => {
      (prisma.aIConfig.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      vi.resetModules();
      const { getAISettings, invalidateSettingsCache } = await import("@/lib/ai/settings");

      await getAISettings();
      expect(prisma.aIConfig.findUnique).toHaveBeenCalledTimes(1);

      invalidateSettingsCache();
      await getAISettings();
      expect(prisma.aIConfig.findUnique).toHaveBeenCalledTimes(2);
    });
  });
});
