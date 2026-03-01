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
