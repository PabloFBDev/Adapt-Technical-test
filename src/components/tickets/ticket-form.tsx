"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Type,
  AlignLeft,
  Signal,
  Tags,
  Save,
  Plus,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagInput } from "./tag-input";
import { createTicketSchema, updateTicketSchema } from "@/schemas/ticket";
import type { Ticket } from "@prisma/client";

interface TicketFormProps {
  ticket?: Ticket;
  mode: "create" | "edit";
}

const REQUIRED_FIELDS = 3; // title, description, priority

export function TicketForm({ ticket, mode }: TicketFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const [title, setTitle] = useState(ticket?.title || "");
  const [description, setDescription] = useState(ticket?.description || "");
  const [priority, setPriority] = useState<string>(ticket?.priority || "");
  const [tags, setTags] = useState<string[]>(ticket?.tags || []);

  const filledFields = [title, description, priority].filter(Boolean).length;
  const progress = (filledFields / REQUIRED_FIELDS) * 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const data = { title, description, priority, tags };
    const schema = mode === "create" ? createTicketSchema : updateTicketSchema;
    const result = schema.safeParse(data);

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }

    setLoading(true);
    try {
      const url =
        mode === "create"
          ? "/api/tickets"
          : `/api/tickets/${ticket!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar ticket");
      }

      const json = await res.json();
      toast.success(
        mode === "create" ? "Ticket criado com sucesso!" : "Ticket atualizado com sucesso!"
      );
      router.push(`/tickets/${json.data.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="relative max-w-2xl shadow-xl shadow-primary/5 animate-fade-in-up glass-premium border-border/40 has-[:focus-visible]:border-primary/25 has-[:focus-visible]:shadow-primary/10 transition-all duration-500">
      {/* Top accent gradient */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent rounded-t-xl" />

      <CardContent className="pt-8 pb-8">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2.5">
            <span className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
              Progresso
            </span>
            <span className="font-mono text-[10px] text-muted-foreground/60 tabular-nums">
              {filledFields}/{REQUIRED_FIELDS} campos
            </span>
          </div>
          <div className="h-1 w-full bg-muted/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary/70 to-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/70">
              Titulo
            </Label>
            <div className="relative group">
              <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary/70 transition-colors" />
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titulo do ticket"
                className="pl-10 h-11 rounded-lg"
                aria-invalid={!!errors.title}
              />
            </div>
            {errors.title && (
              <p className="font-mono text-[11px] text-destructive flex items-center gap-1.5 animate-scale-in">
                <span className="inline-block h-1 w-1 rounded-full bg-destructive" />
                {errors.title[0]}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/70">
              Descricao
            </Label>
            <div className="relative group">
              <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary/70 transition-colors" />
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o ticket em detalhes..."
                rows={6}
                className="pl-10 transition-shadow duration-200 rounded-lg"
              />
            </div>
            <div className="flex justify-between">
              {errors.description ? (
                <p className="font-mono text-[11px] text-destructive flex items-center gap-1.5 animate-scale-in">
                  <span className="inline-block h-1 w-1 rounded-full bg-destructive" />
                  {errors.description[0]}
                </p>
              ) : <span />}
              <span className="font-mono text-[10px] text-muted-foreground/50 tabular-nums">
                {description.length}
              </span>
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/70">
              Prioridade
            </Label>
            <div className="relative">
              <Signal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 z-10 pointer-events-none" />
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-11 pl-10 rounded-lg">
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {errors.priority && (
              <p className="font-mono text-[11px] text-destructive flex items-center gap-1.5 animate-scale-in">
                <span className="inline-block h-1 w-1 rounded-full bg-destructive" />
                {errors.priority[0]}
              </p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1.5">
              <Tags className="h-3.5 w-3.5" />
              Tags
            </Label>
            <TagInput value={tags} onChange={setTags} error={errors.tags?.[0]} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-border/30">
            <Button type="submit" disabled={loading} className="gap-2 rounded-lg shadow-lg shadow-primary/15 hover:shadow-primary/25 transition-all">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Salvando...
                </span>
              ) : mode === "create" ? (
                <>
                  <Plus className="h-4 w-4" />
                  Criar Ticket
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Alteracoes
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="gap-2 rounded-lg"
            >
              <ArrowLeft className="h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
