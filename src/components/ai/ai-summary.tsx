"use client";

import { useState, useCallback, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AISummarySkeleton } from "./ai-summary-skeleton";
import { cn } from "@/lib/utils";
import type { AIResult } from "@/lib/ai/types";
import type { AICache } from "@prisma/client";

const PROVIDER_LABELS: Record<string, string> = {
  mock: "Mock (teste)",
  openai: "OpenAI",
  anthropic: "Anthropic",
  gemini: "Gemini",
};

interface AISummaryProps {
  ticketId: string;
  cachedResult: AICache | null;
}

const riskColors = {
  low: "bg-status-done/15 text-status-done border-status-done/30",
  medium: "bg-priority-medium/15 text-priority-medium border-priority-medium/30",
  high: "bg-priority-high/15 text-priority-high border-priority-high/30 animate-glow-pulse",
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
  const [providers, setProviders] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("");

  useEffect(() => {
    fetch("/api/ai/providers")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setProviders(data.providers);
          setSelectedProvider(data.default);
        }
      })
      .catch(() => {});
  }, []);

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
        body: JSON.stringify({ ticketId, provider: selectedProvider || undefined }),
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
    } catch {
      setLoading(false);
      setStreaming(false);
    }
  }, [ticketId, selectedProvider]);

  if (loading) {
    return <AISummarySkeleton />;
  }

  if (!result && !streaming) {
    return (
      <Card className="border-dashed border-ai/30 bg-ai/[0.02]">
        <CardContent className="flex flex-col items-center py-8">
          <div className="rounded-full bg-ai/10 p-4 mb-3 animate-subtle-float">
            <Sparkles className="h-6 w-6 text-ai" />
          </div>
          <p className="text-sm font-medium mb-1">Analise com IA</p>
          <p className="text-xs text-muted-foreground mb-4 text-center max-w-xs">
            Gere um resumo inteligente com sugestoes de proximos passos
          </p>
          <div className="flex items-center gap-2">
            {providers.length > 1 && (
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PROVIDER_LABELS[p] || p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button onClick={generateSummary} className="bg-ai hover:bg-ai/90 text-white gap-2">
              <Sparkles className="h-4 w-4" />
              Gerar Resumo
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayResult = result;
  const showSummary = displayResult?.summary || partialSummary;
  const showSteps = displayResult?.nextSteps || partialSteps;

  return (
    <Card className={cn(
      "border-ai/30 bg-ai/[0.02] glass",
      streaming && "relative overflow-hidden"
    )}>
      {streaming && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5 animate-scan-line"
          style={{
            background: "linear-gradient(90deg, transparent, var(--ai), transparent)",
            backgroundSize: "200% 100%",
          }}
        />
      )}
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-ai" />
            <CardTitle className="text-lg">Resumo IA</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isCached && cachedAt && (
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {cachedAt.toLocaleString("pt-BR")}
              </span>
            )}
            {streaming && (
              <Badge variant="secondary" className="animate-pulse font-mono text-[11px]">
                Gerando...
              </Badge>
            )}
            {providers.length > 1 && (
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PROVIDER_LABELS[p] || p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <h4 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Resumo
            </h4>
            <p className="text-sm text-muted-foreground">{showSummary}</p>
          </div>
        )}

        {showSteps.length > 0 && (
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Proximos Passos
            </h4>
            <ol className="space-y-1">
              {showSteps.map((step, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="font-mono text-ai shrink-0 bg-ai/10 rounded-full h-5 w-5 flex items-center justify-center text-[11px] mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        {displayResult && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Risco:
              </span>
              <Badge
                variant="outline"
                className={cn("font-mono text-[11px]", riskColors[displayResult.riskLevel])}
                style={displayResult.riskLevel === "high" ? { "--glow-color": "var(--priority-high)" } as React.CSSProperties : undefined}
              >
                {displayResult.riskLevel === "low"
                  ? "Baixo"
                  : displayResult.riskLevel === "medium"
                    ? "Medio"
                    : "Alto"}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground mr-1">
                Categorias:
              </span>
              {displayResult.categories.map((cat) => (
                <Badge key={cat} variant="outline" className="font-mono text-[11px]">
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
