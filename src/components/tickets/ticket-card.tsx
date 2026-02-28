import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./status-badge";
import { PriorityBadge } from "./priority-badge";
import type { TicketListItem } from "@/types";

export function TicketCard({ ticket }: { ticket: TicketListItem }) {
  return (
    <Link href={`/tickets/${ticket.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-medium line-clamp-1">
              {ticket.title}
            </CardTitle>
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
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {ticket.tags.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{ticket.tags.length - 4}
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(ticket.createdAt).toLocaleDateString("pt-BR")}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
