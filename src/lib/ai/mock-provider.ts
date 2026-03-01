import type { AIProvider, AIResult, AIStreamChunk } from "./types";
import { simulateStream } from "./stream-utils";

export class MockAIProvider implements AIProvider {
  async *generateSummary(input: {
    title: string;
    description: string;
  }): AsyncGenerator<AIStreamChunk> {
    const result = this.buildResult(input);
    yield* simulateStream(result);
  }

  buildResult(input: { title: string; description: string }): AIResult {
    const titleLower = input.title.toLowerCase();
    const descLower = input.description.toLowerCase();
    const combined = `${titleLower} ${descLower}`;

    let riskLevel: AIResult["riskLevel"] = "medium";
    const categories: string[] = [];

    if (
      titleLower.includes("bug") ||
      titleLower.includes("error") ||
      titleLower.includes("crash") ||
      titleLower.includes("fail")
    ) {
      riskLevel = "high";
      categories.push("bug");
    } else if (
      titleLower.includes("feature") ||
      titleLower.includes("request") ||
      titleLower.includes("add") ||
      titleLower.includes("new")
    ) {
      riskLevel = "low";
      categories.push("feature");
    }

    if (combined.includes("incident") || combined.includes("outage")) {
      riskLevel = "high";
      if (!categories.includes("incident")) categories.push("incident");
    }

    if (
      combined.includes("security") ||
      combined.includes("vulnerability") ||
      combined.includes("leak")
    ) {
      riskLevel = "high";
      if (!categories.includes("security")) categories.push("security");
    }

    if (categories.length === 0) {
      categories.push("task");
    }

    const summary = this.generateSummaryText(input, riskLevel);
    const nextSteps = this.generateNextSteps(input, categories);

    return { summary, nextSteps, riskLevel, categories };
  }

  private generateSummaryText(
    input: { title: string; description: string },
    riskLevel: string
  ): string {
    const sentences = [
      `Este ticket descreve: "${input.title}".`,
      `O problema reportado envolve o seguinte contexto: ${input.description.substring(0, 100)}${input.description.length > 100 ? "..." : ""}.`,
      `Com base na análise, o nível de risco foi avaliado como ${riskLevel}.`,
      `Este item requer atenção e deve ser priorizado adequadamente.`,
    ];
    return sentences.join(" ");
  }

  private generateNextSteps(
    input: { title: string; description: string },
    categories: string[]
  ): string[] {
    const steps: string[] = [];

    steps.push("Revisar os detalhes do ticket e confirmar o escopo do problema.");

    if (categories.includes("bug") || categories.includes("incident")) {
      steps.push("Investigar a causa raiz e verificar logs relacionados.");
      steps.push("Preparar um hotfix ou solução alternativa se o problema for crítico.");
      steps.push("Notificar as partes interessadas sobre o status atual.");
    } else if (categories.includes("feature")) {
      steps.push("Definir critérios de aceitação e requisitos técnicos.");
      steps.push("Criar plano de implementação com estimativa de esforço.");
      steps.push("Agendar uma revisão com a equipe.");
    } else {
      steps.push("Atribuir a tarefa ao membro apropriado da equipe.");
      steps.push("Definir prazo e acompanhar o progresso.");
    }

    if (input.description.length > 200) {
      steps.push("Considerar dividir em subtarefas menores.");
    }

    return steps;
  }
}
