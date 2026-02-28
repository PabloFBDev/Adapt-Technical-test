"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function TicketFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");

  const updateParams = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.set("page", "1");
      router.push(`/tickets?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      updateParams("search", search || null);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, updateParams]);

  const clearFilters = () => {
    setSearch("");
    router.push("/tickets");
  };

  const hasFilters =
    searchParams.has("status") ||
    searchParams.has("priority") ||
    searchParams.has("search");

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Input
        placeholder="Buscar tickets..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="sm:max-w-xs"
      />
      <Select
        value={searchParams.get("status") || "all"}
        onValueChange={(v) => updateParams("status", v)}
      >
        <SelectTrigger className="sm:w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos status</SelectItem>
          <SelectItem value="open">Aberto</SelectItem>
          <SelectItem value="in_progress">Em Progresso</SelectItem>
          <SelectItem value="done">Concluido</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={searchParams.get("priority") || "all"}
        onValueChange={(v) => updateParams("priority", v)}
      >
        <SelectTrigger className="sm:w-40">
          <SelectValue placeholder="Prioridade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas prioridades</SelectItem>
          <SelectItem value="low">Baixa</SelectItem>
          <SelectItem value="medium">Media</SelectItem>
          <SelectItem value="high">Alta</SelectItem>
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="ghost" onClick={clearFilters} className="sm:w-auto">
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
