"use client";

import { useEffect, useState } from "react";
import { Layers, CircleDot, Loader, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stats {
  total: number;
  byStatus: { open: number; in_progress: number; done: number };
  byPriority: { low: number; medium: number; high: number };
}

const statCards = [
  {
    key: "total" as const,
    label: "Total",
    icon: Layers,
    colorClass: "text-primary",
    bgClass: "bg-primary/10",
    accentGradient: "from-primary/20 to-transparent",
  },
  {
    key: "open" as const,
    label: "Abertos",
    icon: CircleDot,
    colorClass: "text-status-open",
    bgClass: "bg-status-open/10",
    accentGradient: "from-status-open/20 to-transparent",
  },
  {
    key: "in_progress" as const,
    label: "Em Progresso",
    icon: Loader,
    colorClass: "text-status-progress",
    bgClass: "bg-status-progress/10",
    accentGradient: "from-status-progress/20 to-transparent",
  },
  {
    key: "done" as const,
    label: "Concluídos",
    icon: CheckCircle2,
    colorClass: "text-status-done",
    bgClass: "bg-status-done/10",
    accentGradient: "from-status-done/20 to-transparent",
  },
];

function StatCardSkeleton({ index }: { index: number }) {
  const staggerClass = `stagger-${index + 1}`;
  return (
    <div className={cn(
      "rounded-xl border p-5 glass animate-scale-in relative overflow-hidden",
      staggerClass
    )}>
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-muted p-2.5">
          <div className="h-4 w-4" />
        </div>
        <div className="space-y-2">
          <div className="h-7 w-12 rounded-md bg-muted animate-shimmer" />
          <div className="h-3 w-16 rounded bg-muted animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

export function TicketStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/tickets/stats", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} index={i} />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const getCount = (key: string) => {
    if (key === "total") return stats.total;
    return stats.byStatus[key as keyof typeof stats.byStatus] ?? 0;
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {statCards.map((card, i) => {
        const Icon = card.icon;
        const count = getCount(card.key);
        const staggerClass = `stagger-${i + 1}`;

        return (
          <div
            key={card.key}
            className={cn(
              "relative rounded-xl border p-5 glass animate-scale-in hover-lift overflow-hidden group",
              staggerClass
            )}
          >
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
              card.accentGradient
            )} />
            <div className="relative flex items-center gap-3">
              <div className={cn("rounded-lg p-2.5", card.bgClass)}>
                <Icon className={cn("h-4 w-4", card.colorClass)} />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums animate-count-up tracking-tight">
                  {count}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                  {card.label}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
