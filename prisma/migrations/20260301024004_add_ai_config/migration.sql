-- CreateTable
CREATE TABLE "AIConfig" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "defaultProvider" TEXT NOT NULL DEFAULT 'mock',
    "openaiApiKey" TEXT,
    "openaiModel" TEXT,
    "anthropicApiKey" TEXT,
    "anthropicModel" TEXT,
    "geminiApiKey" TEXT,
    "geminiModel" TEXT,
    "cacheTtlMs" INTEGER NOT NULL DEFAULT 3600000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIConfig_pkey" PRIMARY KEY ("id")
);
