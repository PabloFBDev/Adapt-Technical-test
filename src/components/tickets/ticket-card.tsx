import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  return (
    <Link href={`/tickets/${ticket.id}`} className="group block">
      <Card className={cn(
        "border-l-[3px] hover:shadow-lg hover:shadow-primary/5 cursor-pointer animate-fade-in-up",
        priorityBorderColors[ticket.priority],
        staggerClass
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="font-mono text-xs text-muted-foreground">
                #{ticket.id.slice(0, 8)}
              </span>
              <CardTitle className="text-base font-medium line-clamp-1 group-hover:text-primary transition-colors">
                {ticket.title}
              </CardTitle>
            </div>
            <div className="flex gap-1 shrink-0">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {ticket.description}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {ticket.tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="outline" className="font-mono text-[11px]">
                  {tag}
                </Badge>
              ))}
              {ticket.tags.length > 4 && (
                <Badge variant="outline" className="font-mono text-[11px]">
                  +{ticket.tags.length - 4}
                </Badge>
              )}
            </div>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {new Date(ticket.createdAt).toLocaleDateString("pt-BR")}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
