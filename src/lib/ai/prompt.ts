import type { AIResult } from "./types";

export const SYSTEM_PROMPT = `You are a ticket analysis assistant. Given a ticket title and description, produce a JSON analysis with the following structure:

{
  "summary": "A concise 2-4 sentence summary of the ticket, its context, and implications.",
  "nextSteps": ["Step 1", "Step 2", "Step 3"],
  "riskLevel": "low" | "medium" | "high",
  "categories": ["category1", "category2"]
}

Rules:
- summary: Summarize what the ticket is about and why it matters.
- nextSteps: 3-5 actionable next steps to resolve or progress the ticket.
- riskLevel: "high" for bugs, incidents, security issues, outages. "low" for feature requests, minor improvements. "medium" for everything else.
- categories: 1-3 labels from: "bug", "feature", "task", "incident", "security", "improvement", "documentation".
- Respond ONLY with valid JSON. No markdown, no code fences, no extra text.`;

export function buildUserPrompt(input: {
  title: string;
  description: string;
}): string {
  return `Ticket Title: ${input.title}\n\nTicket Description: ${input.description}`;
}

export function parseAIResult(text: string): AIResult {
  try {
    // Try to extract JSON from the response (handle markdown fences)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : "Unable to generate summary.",
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.filter((s: unknown) => typeof s === "string") : ["Review the ticket details."],
      riskLevel: ["low", "medium", "high"].includes(parsed.riskLevel) ? parsed.riskLevel : "medium",
      categories: Array.isArray(parsed.categories) ? parsed.categories.filter((c: unknown) => typeof c === "string") : ["task"],
    };
  } catch {
    return {
      summary: "Unable to parse AI response. Please review the ticket manually.",
      nextSteps: ["Review the ticket details and confirm the scope."],
      riskLevel: "medium",
      categories: ["task"],
    };
  }
}
