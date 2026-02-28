"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AISummarySkeleton } from "./ai-summary-skeleton";
import type { AIResult } from "@/lib/ai/types";
import type { AICache } from "@prisma/client";

interface AISummaryProps {
  ticketId: string;
  cachedResult: AICache | null;
}

const riskColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

export function AISummary({ ticketId, cachedResult }: AISummaryProps) {
  const [result, setResult] = useState<AIResult | null>(
    cachedResult ? (cachedResult.result as unknown as AIResult) : null
  );
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [partialSummary, setPartialSummary] = useState("");
  const [partialSteps, setPartialSteps] = useState<string[]>([]);
  const [isCached, setIsCached] = useState(!!cachedResult);
  const [cachedAt, setCachedAt] = useState<Date | null>(
    cachedResult ? new Date(cachedResult.createdAt) : null
  );

  const generateSummary = useCallback(async () => {
    setLoading(true);
    setStreaming(false);
    setPartialSummary("");
    setPartialSteps([]);
    setResult(null);
    setIsCached(false);

    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });

      if (!res.ok) {
        throw new Error("Falha ao gerar resumo");
      }

      // Check if it's a cached JSON response
      const contentType = res.headers.get("Content-Type") || "";
      if (contentType.includes("application/json")) {
        const json = await res.json();
        setResult(json.data);
        setIsCached(true);
        setCachedAt(new Date());
        setLoading(false);
        return;
      }

      // SSE streaming
      setStreaming(true);
      setLoading(false);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const jsonStr = trimmed.slice(6);

          try {
            const chunk = JSON.parse(jsonStr);

            if (chunk.type === "chunk") {
              if (chunk.field === "summary") {
                setPartialSummary((prev) =>
                  prev ? `${prev} ${chunk.content}` : chunk.content
                );
              } else if (chunk.field === "nextSteps") {
                setPartialSteps((prev) => [...prev, chunk.content]);
              }
            } else if (chunk.type === "done") {
              setResult(chunk.result);
              setStreaming(false);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    } catch (err) {
      console.error("AI Summary error:", err);
      setLoading(false);
      setStreaming(false);
    }
  }, [ticketId]);

  if (loading) {
    return <AISummarySkeleton />;
  }

  if (!result && !streaming) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumo IA</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={generateSummary}>Gerar Resumo IA</Button>
        </CardContent>
      </Card>
    );
  }

  const displayResult = result;
  const showSummary = displayResult?.summary || partialSummary;
  const showSteps = displayResult?.nextSteps || partialSteps;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Resumo IA</CardTitle>
          <div className="flex items-center gap-2">
            {isCached && cachedAt && (
              <span className="text-xs text-muted-foreground">
                Gerado em {cachedAt.toLocaleString("pt-BR")}
              </span>
            )}
            {streaming && (
              <Badge variant="secondary" className="animate-pulse">
                Gerando...
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={generateSummary}>
              Regenerar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showSummary && (
          <div>
            <h4 className="font-medium mb-1">Resumo</h4>
            <p className="text-sm text-muted-foreground">{showSummary}</p>
          </div>
        )}

        {showSteps.length > 0 && (
          <div>
            <h4 className="font-medium mb-1">Proximos Passos</h4>
            <ul className="list-disc list-inside space-y-1">
              {showSteps.map((step, i) => (
                <li key={i} className="text-sm text-muted-foreground">
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}

        {displayResult && (
          <div className="flex items-center gap-3">
            <div>
              <span className="text-sm font-medium mr-2">Risco:</span>
              <Badge className={riskColors[displayResult.riskLevel]}>
                {displayResult.riskLevel === "low"
                  ? "Baixo"
                  : displayResult.riskLevel === "medium"
                    ? "Medio"
                    : "Alto"}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium mr-1">Categorias:</span>
              {displayResult.categories.map((cat) => (
                <Badge key={cat} variant="outline">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
