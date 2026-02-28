import type { Ticket, AuditLog, User, AICache } from "@prisma/client";

export type TicketWithRelations = Ticket & {
  user: Pick<User, "id" | "email" | "name">;
  auditLogs: AuditLog[];
  aiCache: AICache | null;
};

export type TicketListItem = Ticket & {
  user: Pick<User, "id" | "email" | "name">;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ApiError = {
  error: string;
  details?: unknown;
};
