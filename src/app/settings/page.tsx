"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Settings, Eye, EyeOff, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  };

  const toggleKeyVisibility = (field: string) => {
    setShowKeys((prev) => ({ ...prev, [field]: !prev[field] }));
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

        <div className="space-y-8 max-w-2xl">
          {/* Default Provider */}
          <section className="space-y-3">
            <Label>Provider padrão</Label>
            <Select
              value={config.defaultProvider}
              onValueChange={(v) => updateField("defaultProvider", v)}
            >
              <SelectTrigger className="w-full">
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
          </section>

          {/* OpenAI */}
          <section className="space-y-3 rounded-lg border p-4">
            <h2 className="font-semibold text-sm">OpenAI</h2>
            <div className="space-y-2">
              <Label htmlFor="openaiApiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="openaiApiKey"
                  type={showKeys.openai ? "text" : "password"}
                  value={config.openaiApiKey || ""}
                  onChange={(e) => updateField("openaiApiKey", e.target.value)}
                  placeholder="sk-..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => toggleKeyVisibility("openai")}
                >
                  {showKeys.openai ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="openaiModel">Modelo</Label>
              <Input
                id="openaiModel"
                value={config.openaiModel}
                onChange={(e) => updateField("openaiModel", e.target.value)}
                placeholder="gpt-4o-mini"
              />
            </div>
          </section>

          {/* Anthropic */}
          <section className="space-y-3 rounded-lg border p-4">
            <h2 className="font-semibold text-sm">Anthropic</h2>
            <div className="space-y-2">
              <Label htmlFor="anthropicApiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="anthropicApiKey"
                  type={showKeys.anthropic ? "text" : "password"}
                  value={config.anthropicApiKey || ""}
                  onChange={(e) =>
                    updateField("anthropicApiKey", e.target.value)
                  }
                  placeholder="sk-ant-..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => toggleKeyVisibility("anthropic")}
                >
                  {showKeys.anthropic ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="anthropicModel">Modelo</Label>
              <Input
                id="anthropicModel"
                value={config.anthropicModel}
                onChange={(e) => updateField("anthropicModel", e.target.value)}
                placeholder="claude-haiku-4-5-20251001"
              />
            </div>
          </section>

          {/* Gemini */}
          <section className="space-y-3 rounded-lg border p-4">
            <h2 className="font-semibold text-sm">Google Gemini</h2>
            <div className="space-y-2">
              <Label htmlFor="geminiApiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="geminiApiKey"
                  type={showKeys.gemini ? "text" : "password"}
                  value={config.geminiApiKey || ""}
                  onChange={(e) => updateField("geminiApiKey", e.target.value)}
                  placeholder="AIza..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => toggleKeyVisibility("gemini")}
                >
                  {showKeys.gemini ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="geminiModel">Modelo</Label>
              <Input
                id="geminiModel"
                value={config.geminiModel}
                onChange={(e) => updateField("geminiModel", e.target.value)}
                placeholder="gemini-2.0-flash"
              />
            </div>
          </section>

          {/* Cache TTL */}
          <section className="space-y-3">
            <Label htmlFor="cacheTtlMs">Cache TTL (ms)</Label>
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
            />
            <p className="text-xs text-muted-foreground">
              Tempo de cache dos resultados de IA em milissegundos (0 =
              desabilitado, max 24h)
            </p>
          </section>

          {/* Save */}
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar configurações
          </Button>
        </div>
      </div>
    </AuthGuard>
  );
}
