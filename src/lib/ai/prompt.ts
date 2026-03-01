import type { AIResult } from "./types";

export const SYSTEM_PROMPT = `Você é um assistente de análise de tickets. Dado o título e a descrição de um ticket, produza uma análise em JSON com a seguinte estrutura:

{
  "summary": "Resumo conciso de 2-4 frases sobre o ticket, seu contexto e implicações.",
  "nextSteps": ["Passo 1", "Passo 2", "Passo 3"],
  "riskLevel": "low" | "medium" | "high",
  "categories": ["category1", "category2"]
}

Regras:
- summary: Resuma do que se trata o ticket e por que é importante.
- nextSteps: 3-5 próximos passos acionáveis para resolver ou avançar o ticket.
- riskLevel: "high" para bugs, incidentes, problemas de segurança, indisponibilidades. "low" para pedidos de funcionalidade, melhorias menores. "medium" para todo o resto.
- categories: 1-3 rótulos dentre: "bug", "feature", "task", "incident", "security", "improvement", "documentation".
- Responda SEMPRE em português brasileiro (pt-BR).
- Responda SOMENTE com JSON válido. Sem markdown, sem blocos de código, sem texto extra.`;

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
      summary: typeof parsed.summary === "string" ? parsed.summary : "Não foi possível gerar o resumo.",
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.filter((s: unknown) => typeof s === "string") : ["Revisar os detalhes do ticket."],
      riskLevel: ["low", "medium", "high"].includes(parsed.riskLevel) ? parsed.riskLevel : "medium",
      categories: Array.isArray(parsed.categories) ? parsed.categories.filter((c: unknown) => typeof c === "string") : ["task"],
    };
  } catch {
    return {
      summary: "Não foi possível interpretar a resposta da IA. Revise o ticket manualmente.",
      nextSteps: ["Revisar os detalhes do ticket e confirmar o escopo."],
      riskLevel: "medium",
      categories: ["task"],
    };
  }
}
