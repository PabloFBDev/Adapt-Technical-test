import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
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
        "border-l-[3px] hover:shadow-lg hover:shadow-primary/8 hover:-translate-y-[1px] hover:border-primary/20 cursor-pointer animate-fade-in-up",
        priorityBorderColors[ticket.priority],
        staggerClass
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="font-mono text-[11px] text-muted-foreground/70 tracking-wider">
                #{ticket.id.slice(0, 8)}
              </span>
              <CardTitle className="text-base font-medium line-clamp-1 group-hover:text-primary transition-colors">
                {ticket.title}
              </CardTitle>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <ChevronRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-all duration-200 group-hover:translate-x-0.5" />
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
            <span className="font-mono text-xs text-muted-foreground tabular-nums flex items-center gap-1.5">
              {isAging && (
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full bg-priority-medium"
                  title={`${daysOld} dias`}
                />
              )}
              {new Date(ticket.createdAt).toLocaleDateString("pt-BR")}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
