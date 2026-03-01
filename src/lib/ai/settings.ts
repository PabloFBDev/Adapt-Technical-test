import { prisma } from "@/lib/prisma";

export interface AISettings {
  defaultProvider: string;
  openaiApiKey: string | null;
  openaiModel: string;
  anthropicApiKey: string | null;
  anthropicModel: string;
  geminiApiKey: string | null;
  geminiModel: string;
  cacheTtlMs: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let cachedSettings: { data: AISettings; expiresAt: number } | null = null;

export function invalidateSettingsCache() {
  cachedSettings = null;
}

export async function getAISettings(): Promise<AISettings> {
  if (cachedSettings && Date.now() < cachedSettings.expiresAt) {
    return cachedSettings.data;
  }

  const config = await prisma.aIConfig.findUnique({
    where: { id: "singleton" },
  });

  const settings: AISettings = {
    defaultProvider:
      config?.defaultProvider || process.env.AI_PROVIDER || "mock",
    openaiApiKey:
      config?.openaiApiKey || process.env.OPENAI_API_KEY || null,
    openaiModel:
      config?.openaiModel || process.env.OPENAI_MODEL || "gpt-4o-mini",
    anthropicApiKey:
      config?.anthropicApiKey || process.env.ANTHROPIC_API_KEY || null,
    anthropicModel:
      config?.anthropicModel ||
      process.env.ANTHROPIC_MODEL ||
      "claude-haiku-4-5-20251001",
    geminiApiKey:
      config?.geminiApiKey || process.env.GEMINI_API_KEY || null,
    geminiModel:
      config?.geminiModel || process.env.GEMINI_MODEL || "gemini-2.0-flash",
    cacheTtlMs:
      config?.cacheTtlMs ??
      (Number(process.env.AI_CACHE_TTL_MS) || 3600000),
  };

  cachedSettings = { data: settings, expiresAt: Date.now() + CACHE_TTL };
  return settings;
}

export function maskApiKey(key: string | null): string | null {
  if (!key) return null;
  if (key.length <= 4) return "\u2022".repeat(key.length);
  return "\u2022".repeat(key.length - 4) + key.slice(-4);
}
