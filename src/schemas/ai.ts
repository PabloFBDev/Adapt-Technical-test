import { z } from "zod";

const providerEnum = z.enum(["mock", "openai", "anthropic", "gemini"]).optional();

export const summarizeSchema = z.union([
  z.object({
    ticketId: z.string().min(1, "ticketId is required"),
    provider: providerEnum,
  }),
  z.object({
    title: z.string().min(3).max(120),
    description: z.string().min(10).max(5000),
    provider: providerEnum,
  }),
]);

export type SummarizeInput = z.infer<typeof summarizeSchema>;

export const aiConfigSchema = z.object({
  defaultProvider: z
    .enum(["mock", "openai", "anthropic", "gemini"])
    .optional(),
  openaiApiKey: z.string().optional().nullable(),
  openaiModel: z.string().max(100).optional().nullable(),
  anthropicApiKey: z.string().optional().nullable(),
  anthropicModel: z.string().max(100).optional().nullable(),
  geminiApiKey: z.string().optional().nullable(),
  geminiModel: z.string().max(100).optional().nullable(),
  cacheTtlMs: z.number().int().min(0).max(86400000).optional(),
});

export type AIConfigInput = z.infer<typeof aiConfigSchema>;
