"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

export function TicketForm({ ticket, mode }: TicketFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const [title, setTitle] = useState(ticket?.title || "");
  const [description, setDescription] = useState(ticket?.description || "");
  const [priority, setPriority] = useState<string>(ticket?.priority || "");
  const [tags, setTags] = useState<string[]>(ticket?.tags || []);

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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl animate-fade-in-up">
      <div className="space-y-2">
        <Label htmlFor="title" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Titulo
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titulo do ticket"
          className="h-11"
        />
        {errors.title && (
          <p className="font-mono text-xs text-destructive">{errors.title[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Descricao
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva o ticket em detalhes..."
          rows={6}
        />
        {errors.description && (
          <p className="font-mono text-xs text-destructive">{errors.description[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Prioridade
        </Label>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Selecione a prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Baixa</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
          </SelectContent>
        </Select>
        {errors.priority && (
          <p className="font-mono text-xs text-destructive">{errors.priority[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Tags
        </Label>
        <TagInput value={tags} onChange={setTags} error={errors.tags?.[0]} />
      </div>

      <div className="flex gap-3 pt-4 border-t border-border/50">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Salvando...
            </span>
          ) : mode === "create" ? (
            "Criar Ticket"
          ) : (
            "Salvar Alteracoes"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
