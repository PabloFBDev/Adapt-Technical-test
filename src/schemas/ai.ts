import { z } from "zod";

export const summarizeSchema = z.union([
  z.object({ ticketId: z.string().min(1, "ticketId is required") }),
  z.object({
    title: z.string().min(3).max(120),
    description: z.string().min(10).max(5000),
  }),
]);

export type SummarizeInput = z.infer<typeof summarizeSchema>;
