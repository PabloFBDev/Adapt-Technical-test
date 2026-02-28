import type { AIProvider, AIResult, AIStreamChunk } from "./types";

export class MockAIProvider implements AIProvider {
  async *generateSummary(input: {
    title: string;
    description: string;
  }): AsyncGenerator<AIStreamChunk> {
    const result = this.buildResult(input);

    const summaryChunks = this.chunkText(result.summary, 10);
    for (const chunk of summaryChunks) {
      yield { type: "chunk", field: "summary", content: chunk };
      await this.delay(50 + Math.random() * 50);
    }

    for (const step of result.nextSteps) {
      yield { type: "chunk", field: "nextSteps", content: step };
      await this.delay(80 + Math.random() * 40);
    }

    yield { type: "chunk", field: "riskLevel", content: result.riskLevel };
    yield {
      type: "chunk",
      field: "categories",
      content: JSON.stringify(result.categories),
    };

    yield { type: "done", result };
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
      `This ticket describes: "${input.title}".`,
      `The reported issue involves the following context: ${input.description.substring(0, 100)}${input.description.length > 100 ? "..." : ""}.`,
      `Based on the analysis, the risk level has been assessed as ${riskLevel}.`,
      `This item requires attention and should be prioritized accordingly.`,
    ];
    return sentences.join(" ");
  }

  private generateNextSteps(
    input: { title: string; description: string },
    categories: string[]
  ): string[] {
    const steps: string[] = [];

    steps.push("Review the ticket details and confirm the scope of the issue.");

    if (categories.includes("bug") || categories.includes("incident")) {
      steps.push("Investigate root cause and check related logs.");
      steps.push("Prepare a hotfix or workaround if the issue is critical.");
      steps.push("Notify stakeholders about the current status.");
    } else if (categories.includes("feature")) {
      steps.push("Define acceptance criteria and technical requirements.");
      steps.push("Create implementation plan with estimated effort.");
      steps.push("Schedule a review with the team.");
    } else {
      steps.push("Assign the task to the appropriate team member.");
      steps.push("Set a deadline and track progress.");
    }

    if (input.description.length > 200) {
      steps.push("Consider breaking this into smaller sub-tasks.");
    }

    return steps;
  }

  private chunkText(text: string, wordsPerChunk: number): string[] {
    const words = text.split(" ");
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += wordsPerChunk) {
      chunks.push(words.slice(i, i + wordsPerChunk).join(" "));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
