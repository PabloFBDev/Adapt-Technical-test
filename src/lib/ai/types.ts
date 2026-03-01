export interface AIResult {
  summary: string;
  nextSteps: string[];
  riskLevel: "low" | "medium" | "high";
  categories: string[];
}

export type AIStreamChunk =
  | { type: "chunk"; field: keyof AIResult; content: string }
  | { type: "done"; result: AIResult }
  | { type: "error"; message: string };

export interface AIProvider {
  generateSummary(input: {
    title: string;
    description: string;
  }): AsyncGenerator<AIStreamChunk>;
}
