import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aiConfigSchema } from "@/schemas/ai";
import { getAISettings, maskApiKey, invalidateSettingsCache } from "@/lib/ai/settings";
import { handleApiError } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await getAISettings();

    return NextResponse.json({
      defaultProvider: settings.defaultProvider,
      openaiApiKey: maskApiKey(settings.openaiApiKey),
      openaiModel: settings.openaiModel,
      anthropicApiKey: maskApiKey(settings.anthropicApiKey),
      anthropicModel: settings.anthropicModel,
      geminiApiKey: maskApiKey(settings.geminiApiKey),
      geminiModel: settings.geminiModel,
      cacheTtlMs: settings.cacheTtlMs,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function isMaskedValue(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.includes("\u2022");
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const input = aiConfigSchema.parse(body);

    const data: Record<string, unknown> = {};

    if (input.defaultProvider !== undefined) {
      data.defaultProvider = input.defaultProvider;
    }
    if (input.cacheTtlMs !== undefined) {
      data.cacheTtlMs = input.cacheTtlMs;
    }

    // Handle API keys: skip if masked (unchanged), allow null to clear
    for (const field of [
      "openaiApiKey",
      "anthropicApiKey",
      "geminiApiKey",
    ] as const) {
      const value = input[field];
      if (value === undefined) continue;
      if (value === null || value === "") {
        data[field] = null;
      } else if (!isMaskedValue(value)) {
        data[field] = value;
      }
      // If masked, skip — don't overwrite
    }

    // Handle model fields
    for (const field of [
      "openaiModel",
      "anthropicModel",
      "geminiModel",
    ] as const) {
      const value = input[field];
      if (value === undefined) continue;
      data[field] = value === "" ? null : value;
    }

    await prisma.aIConfig.upsert({
      where: { id: "singleton" },
      update: data,
      create: { id: "singleton", ...data },
    });

    invalidateSettingsCache();
    const settings = await getAISettings();

    return NextResponse.json({
      defaultProvider: settings.defaultProvider,
      openaiApiKey: maskApiKey(settings.openaiApiKey),
      openaiModel: settings.openaiModel,
      anthropicApiKey: maskApiKey(settings.anthropicApiKey),
      anthropicModel: settings.anthropicModel,
      geminiApiKey: maskApiKey(settings.geminiApiKey),
      geminiModel: settings.geminiModel,
      cacheTtlMs: settings.cacheTtlMs,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
