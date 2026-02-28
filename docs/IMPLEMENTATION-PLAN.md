# Plan: Ops Copilot — Full Implementation

## Context
Build the Ops Copilot project from scratch based on detailed specs in `docs/`. This is a ticket/incident management system with AI summaries, built with Next.js 14+ App Router, Prisma, NextAuth, Tailwind + shadcn/ui, Zod, and Vitest.

## Implementation Order

### Phase 1: Project Scaffolding
1. Initialize Next.js 14+ project with TypeScript strict, Tailwind CSS, App Router
2. Install dependencies: prisma, @prisma/client, next-auth, bcryptjs, zod
3. Install dev dependencies: vitest, @testing-library/react, @types/bcryptjs
4. Configure `tsconfig.json` (strict: true, path aliases)
5. Create `.env.example` with all documented variables (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, AI_PROVIDER, AI_CACHE_TTL_MS)
6. Configure `vitest.config.ts` + `__tests__/setup.ts` (global mocks for Prisma, etc.)

### Phase 2: Database & ORM
1. Create `prisma/schema.prisma` with User, Ticket, AuditLog, AICache models + enums (TicketStatus, TicketPriority, AuditAction)
2. Note: JWT strategy — no session/account tables needed in Prisma
3. Create `prisma/seed.ts` — seed default user (admin@opscopilot.com / password123, **hashed with bcrypt**) + sample tickets
4. Create `src/lib/prisma.ts` — Prisma client singleton
5. Run `npx prisma migrate dev` to apply schema
6. Run `npx prisma db seed` to populate data

### Phase 3: Shared Types & Schemas
1. Create `src/lib/ai/types.ts` — AIResult, AIStreamChunk, AIProvider interface
2. Create `src/types/index.ts` — shared types (Ticket with relations, etc.)
3. Create `src/schemas/ticket.ts` — createTicketSchema, updateTicketSchema, ticketQuerySchema
4. Create `src/schemas/ai.ts` — summarizeSchema (union: ticketId OR {title, description})

### Phase 4: Authentication
1. Create `src/lib/auth.ts` — NextAuth config with Credentials provider, JWT strategy, bcrypt compare
2. Create `src/app/api/auth/[...nextauth]/route.ts`
3. Create `src/middleware.ts` — **Important:** matcher covers `/tickets/new`, `/tickets/:path*/edit`, `/api/ai/:path*`. For `/api/tickets/:path*`, the GET (public) vs POST/PATCH (protected) distinction is handled **inside each route handler** with `getServerSession()` checks, not in middleware.

### Phase 5: AI Provider Layer
1. Create `src/lib/ai/mock-provider.ts` — MockAIProvider with streaming simulation (50-100ms delay per chunk), deterministic results based on keywords
2. Create `src/lib/ai/factory.ts` — getAIProvider() returns MockAIProvider by default
3. Create `src/lib/ai/cache.ts` — get/set/invalidate cache logic. **Invalidation** is called from the PATCH ticket handler when title or description change.

### Phase 6: API Route Handlers + Audit Logic
1. Create `src/lib/utils.ts` — handleApiError helper, cn utility
2. Create `src/app/api/tickets/route.ts` — GET (list, public, paginated) + POST (create, protected, creates AuditLog with action `created`)
3. Create `src/app/api/tickets/[id]/route.ts` — GET (detail, public) + PATCH (update, protected):
   - Computes diff for each changed field
   - Creates AuditLog: action `status_changed` if status changed, `updated` otherwise
   - Stores changes as `{ field: { from, to } }`
   - Calls cache invalidation if title/description changed
4. Create `src/app/api/ai/summarize/route.ts` — POST with SSE streaming:
   - Check cache first (by ticketId) → return cached if valid (non-streaming)
   - Call AIProvider.generateSummary() → stream via SSE
   - Save result to AICache on completion

### Phase 7-8: UI Features (vertical slices per feature)

**7a. Layout & Auth UI**
- Install shadcn/ui components: button, input, textarea, select, badge, card, skeleton, label, dropdown-menu, separator, toast (sonner)
- Create `src/app/layout.tsx` — root layout with SessionProvider, Toaster, fonts, metadata
- Create `src/components/auth/login-form.tsx`
- Create `src/components/auth/auth-guard.tsx` — client-side auth check wrapper
- Create `src/app/login/page.tsx`
- Create `src/app/page.tsx` — redirect to /tickets

**7b. Ticket Listing**
- Create `src/components/tickets/status-badge.tsx`
- Create `src/components/tickets/priority-badge.tsx`
- Create `src/components/tickets/ticket-card.tsx`
- Create `src/components/tickets/ticket-filters.tsx` — status/priority selects, search with 300ms debounce
- Create `src/components/tickets/ticket-list.tsx` — with pagination, loading skeleton, empty state
- Create `src/app/tickets/page.tsx` — listing page using above components

**7c. Ticket Creation**
- Create `src/components/tickets/tag-input.tsx` — chips/tags input component
- Create `src/components/tickets/ticket-form.tsx` — form with Zod validation, inline errors
- Create `src/app/tickets/new/page.tsx` — create ticket page with success toast + redirect

**7d. Ticket Detail + AI + Audit**
- Create `src/components/ai/ai-summary-skeleton.tsx`
- Create `src/components/ai/ai-summary.tsx` — SSE consumption, progressive rendering, cached indicator
- Create `src/components/audit/audit-timeline.tsx` — timeline/list of changes (most recent first)
- Create `src/components/tickets/ticket-detail.tsx` — full ticket view with status change inline
- Create `src/app/tickets/[id]/page.tsx` — detail page with AI summary button + audit timeline

**7e. Ticket Editing**
- Create `src/app/tickets/[id]/edit/page.tsx` — edit form pre-loaded with current values

### Phase 9: Tests
1. Create `__tests__/setup.ts` — global mocks (Prisma client mock, NextAuth session mock)
2. Create `__tests__/lib/ai/mock-provider.test.ts` — valid AIResult, correct streaming chunks, keyword-based risk/categories
3. Create `__tests__/lib/ai/factory.test.ts` — returns MockAIProvider by default
4. Create `__tests__/lib/ai/cache.test.ts` — get/set/invalidate/TTL expiry
5. Create `__tests__/schemas/ticket.test.ts` — valid/invalid inputs, defaults, partial updates
6. Create `__tests__/schemas/ai.test.ts` — ticketId OR {title,description}, rejects invalid
7. Create `__tests__/api/tickets.test.ts` — POST 201, POST 400, GET list, GET filtered, PATCH + audit log
8. Create `__tests__/api/ai-summarize.test.ts` — SSE stream, cached response, 404 for missing ticket

### Phase 10: Final Polish & Verification
1. Copy `docs/README.md` to root `README.md`
2. Verify `.env.example` is complete
3. `npm run lint` — fix any lint errors
4. `npm run build` — TypeScript strict compiles without errors
5. `npm test` — all tests pass
6. Manual end-to-end test: login → create ticket → list → filter → detail → edit → change status → generate AI summary → verify audit timeline

## Key Technical Decisions
- NextAuth v4 (JWT strategy, no DB adapter for sessions)
- Middleware protects page routes; API route handlers check session internally for method-level granularity
- MockAIProvider as default — deterministic, no API key needed
- SSE for AI streaming (not WebSockets)
- Offset-based pagination (page/limit)
- Audit log diff computed in PATCH handler, stored as JSON
- AI cache invalidated on ticket title/description edits
