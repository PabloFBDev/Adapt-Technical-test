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
  },
  {
    key: "open" as const,
    label: "Abertos",
    icon: CircleDot,
    colorClass: "text-status-open",
    bgClass: "bg-status-open/10",
  },
  {
    key: "in_progress" as const,
    label: "Em Progresso",
    icon: Loader,
    colorClass: "text-status-progress",
    bgClass: "bg-status-progress/10",
  },
  {
    key: "done" as const,
    label: "Concluidos",
    icon: CheckCircle2,
    colorClass: "text-status-done",
    bgClass: "bg-status-done/10",
  },
];

function StatCardSkeleton({ index }: { index: number }) {
  const staggerClass = `stagger-${index + 1}`;
  return (
    <div className={cn(
      "rounded-lg border p-4 glass animate-scale-in",
      staggerClass
    )}>
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-muted p-2">
          <div className="h-4 w-4" />
        </div>
        <div className="space-y-1.5">
          <div className="h-7 w-10 rounded bg-muted animate-shimmer" />
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
    fetch("/api/tickets/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} index={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const getCount = (key: string) => {
    if (key === "total") return stats.total;
    return stats.byStatus[key as keyof typeof stats.byStatus] ?? 0;
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          const count = getCount(card.key);
          const staggerClass = `stagger-${i + 1}`;

          return (
            <div
              key={card.key}
              className={cn(
                "rounded-lg border p-4 glass animate-scale-in",
                staggerClass
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn("rounded-md p-2", card.bgClass)}>
                  <Icon className={cn("h-4 w-4", card.colorClass)} />
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums animate-count-up">
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
    </div>
  );
}
