import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Clock } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { PriorityBadge } from "./priority-badge";
import { cn } from "@/lib/utils";
import type { TicketListItem } from "@/types";

const priorityBorderColors = {
  low: "border-l-priority-low",
  medium: "border-l-priority-medium",
  high: "border-l-priority-high",
} as const;

export function TicketCard({ ticket, index = 0 }: { ticket: TicketListItem; index?: number }) {
  const staggerClass = index < 5 ? `stagger-${index + 1}` : "";
  const daysOld = Math.floor((Date.now() - new Date(ticket.createdAt).getTime()) / 86400000);
  const isAging = daysOld > 7 && ticket.status !== "done";

  return (
    <Link href={`/tickets/${ticket.id}`} className="group block">
      <Card className={cn(
        "border-l-[3px] hover:shadow-xl hover:shadow-primary/6 hover:-translate-y-[2px] hover:border-primary/15 cursor-pointer animate-fade-in-up transition-all duration-300",
        priorityBorderColors[ticket.priority],
        staggerClass
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="font-mono text-[10px] text-muted-foreground/60 tracking-widest uppercase">
                #{ticket.id.slice(0, 8)}
              </span>
              <CardTitle className="text-base font-semibold line-clamp-1 group-hover:text-primary transition-colors duration-200">
                {ticket.title}
              </CardTitle>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <ChevronRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-all duration-300 group-hover:translate-x-0.5" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground/80 line-clamp-2 mb-3 leading-relaxed">
            {ticket.description}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {ticket.tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="outline" className="font-mono text-[10px] px-2 py-0.5 rounded-full">
                  {tag}
                </Badge>
              ))}
              {ticket.tags.length > 4 && (
                <Badge variant="outline" className="font-mono text-[10px] px-2 py-0.5 rounded-full">
                  +{ticket.tags.length - 4}
                </Badge>
              )}
            </div>
            <span className="font-mono text-[11px] text-muted-foreground/60 tabular-nums flex items-center gap-1.5">
              {isAging && (
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full bg-priority-medium animate-glow-pulse"
                  style={{ "--glow-color": "var(--priority-medium)" } as React.CSSProperties}
                  title={`${daysOld} dias`}
                />
              )}
              <Clock className="h-3 w-3" />
              {new Date(ticket.createdAt).toLocaleDateString("pt-BR")}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
