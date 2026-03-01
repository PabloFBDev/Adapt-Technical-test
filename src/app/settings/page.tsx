"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Settings, Eye, EyeOff, Save, Loader2, Key, Cpu, Timer, Layers, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { toast } from "sonner";

interface AIConfig {
  defaultProvider: string;
  openaiApiKey: string | null;
  openaiModel: string;
  anthropicApiKey: string | null;
  anthropicModel: string;
  geminiApiKey: string | null;
  geminiModel: string;
  cacheTtlMs: number;
}

const PROVIDERS = [
  { value: "mock", label: "Mock (teste)" },
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "gemini", label: "Google Gemini" },
];

export default function SettingsPage() {
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [editedKeys, setEditedKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Erro ao carregar configurações");
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar");
      }

      const updated = await res.json();
      setConfig(updated);
      setShowKeys({});
      setEditedKeys({});
      toast.success("Configurações salvas com sucesso");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao salvar configurações",
      );
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof AIConfig, value: string | number) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
    if (field.endsWith("ApiKey")) {
      setEditedKeys((prev) => ({ ...prev, [field]: true }));
    }
  };

  const toggleKeyVisibility = (field: string) => {
    setShowKeys((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const isKeyEdited = (field: string): boolean => {
    return !!editedKeys[field];
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AuthGuard>
    );
  }

  if (!config) return null;

  return (
    <AuthGuard>
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Configurações" }]} />

        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Configurações de IA
            </h1>
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mt-0.5">
              providers & modelos
            </p>
          </div>
        </div>

        <Card className="relative max-w-4xl shadow-lg shadow-primary/5 animate-fade-in-up glass has-[:focus-visible]:border-primary/30 has-[:focus-visible]:shadow-primary/10 transition-all duration-300">
          {/* Top accent line */}
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <CardContent className="pt-8 pb-8">
            <div className="space-y-6">
              {/* Default Provider */}
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Provider padrão
                </Label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 z-10 pointer-events-none" />
                  <Select
                    value={config.defaultProvider}
                    onValueChange={(v) => updateField("defaultProvider", v)}
                  >
                    <SelectTrigger className="h-11 pl-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDERS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* OpenAI */}
              <div className="space-y-4 rounded-lg border border-border/50 p-4">
                <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">OpenAI</h2>
                <div className="space-y-2">
                  <Label htmlFor="openaiApiKey" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    API Key
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      id="openaiApiKey"
                      type={showKeys.openai && isKeyEdited("openaiApiKey") ? "text" : "password"}
                      value={config.openaiApiKey || ""}
                      onChange={(e) => updateField("openaiApiKey", e.target.value)}
                      placeholder="sk-..."
                      className="pl-10 h-11 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => toggleKeyVisibility("openai")}
                      disabled={!isKeyEdited("openaiApiKey")}
                    >
                      {showKeys.openai && isKeyEdited("openaiApiKey") ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="openaiModel" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Modelo
                  </Label>
                  <div className="relative">
                    <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      id="openaiModel"
                      value={config.openaiModel}
                      onChange={(e) => updateField("openaiModel", e.target.value)}
                      placeholder="gpt-4o-mini"
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Anthropic */}
              <div className="space-y-4 rounded-lg border border-border/50 p-4">
                <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Anthropic</h2>
                <div className="space-y-2">
                  <Label htmlFor="anthropicApiKey" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    API Key
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      id="anthropicApiKey"
                      type={showKeys.anthropic && isKeyEdited("anthropicApiKey") ? "text" : "password"}
                      value={config.anthropicApiKey || ""}
                      onChange={(e) =>
                        updateField("anthropicApiKey", e.target.value)
                      }
                      placeholder="sk-ant-..."
                      className="pl-10 h-11 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => toggleKeyVisibility("anthropic")}
                      disabled={!isKeyEdited("anthropicApiKey")}
                    >
                      {showKeys.anthropic && isKeyEdited("anthropicApiKey") ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="anthropicModel" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Modelo
                  </Label>
                  <div className="relative">
                    <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      id="anthropicModel"
                      value={config.anthropicModel}
                      onChange={(e) => updateField("anthropicModel", e.target.value)}
                      placeholder="claude-haiku-4-5-20251001"
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Gemini */}
              <div className="space-y-4 rounded-lg border border-border/50 p-4">
                <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Google Gemini</h2>
                <div className="space-y-2">
                  <Label htmlFor="geminiApiKey" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    API Key
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      id="geminiApiKey"
                      type={showKeys.gemini && isKeyEdited("geminiApiKey") ? "text" : "password"}
                      value={config.geminiApiKey || ""}
                      onChange={(e) => updateField("geminiApiKey", e.target.value)}
                      placeholder="AIza..."
                      className="pl-10 h-11 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => toggleKeyVisibility("gemini")}
                      disabled={!isKeyEdited("geminiApiKey")}
                    >
                      {showKeys.gemini && isKeyEdited("geminiApiKey") ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="geminiModel" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Modelo
                  </Label>
                  <div className="relative">
                    <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      id="geminiModel"
                      value={config.geminiModel}
                      onChange={(e) => updateField("geminiModel", e.target.value)}
                      placeholder="gemini-2.0-flash"
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Cache TTL */}
              <div className="space-y-2">
                <Label htmlFor="cacheTtlMs" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Cache TTL (ms)
                </Label>
                <div className="relative">
                  <Timer className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    id="cacheTtlMs"
                    type="number"
                    min={0}
                    max={86400000}
                    value={config.cacheTtlMs}
                    onChange={(e) =>
                      updateField("cacheTtlMs", parseInt(e.target.value, 10) || 0)
                    }
                    placeholder="3600000"
                    className="pl-10 h-11"
                  />
                </div>
                <p className="font-mono text-[11px] text-muted-foreground">
                  Tempo de cache dos resultados de IA em milissegundos (0 =
                  desabilitado, max 24h)
                </p>
              </div>

              {/* Save */}
              <div className="pt-6 border-t border-border/50 flex gap-3">
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar configurações
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="gap-2"
                >
                  <Link href="/tickets">
                    <ArrowLeft className="h-4 w-4" />
                    Cancelar
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
