# Plano de Implementação: Ops Copilot

## Contexto
Construção do projeto Ops Copilot do zero, baseado nas especificações em `docs/`. Sistema de gerenciamento de tickets/incidentes com resumos por IA, construído com Next.js 14+ App Router, Prisma, NextAuth, Tailwind + shadcn/ui, Zod e Vitest.

## Ordem de Implementação

### Fase 1: Scaffolding do Projeto
1. Inicializar projeto Next.js 14+ com TypeScript strict, Tailwind CSS, App Router
2. Instalar dependências: prisma, @prisma/client, next-auth, bcryptjs, zod
3. Instalar dependências de desenvolvimento: vitest, @testing-library/react, @types/bcryptjs
4. Configurar `tsconfig.json` (strict: true, path aliases)
5. Criar `.env.example` com todas as variáveis documentadas (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, AI_PROVIDER, AI_CACHE_TTL_MS)
6. Configurar `vitest.config.ts` + `__tests__/setup.ts` (mocks globais para Prisma, etc.)

### Fase 2: Banco de Dados e ORM
1. Criar `prisma/schema.prisma` com models User, Ticket, AuditLog, AICache + enums (TicketStatus, TicketPriority, AuditAction)
2. Nota: estratégia JWT — não é necessário tabelas de session/account no Prisma
3. Criar `prisma/seed.ts` — seed de usuário padrão (admin@opscopilot.com / password123, **hash com bcrypt**) + tickets de exemplo
4. Criar `src/lib/prisma.ts` — singleton do Prisma client
5. Rodar `npx prisma migrate dev` para aplicar o schema
6. Rodar `npx prisma db seed` para popular dados

### Fase 3: Tipos e Schemas Compartilhados
1. Criar `src/lib/ai/types.ts` — AIResult, AIStreamChunk, interface AIProvider
2. Criar `src/types/index.ts` — tipos compartilhados (Ticket com relações, etc.)
3. Criar `src/schemas/ticket.ts` — createTicketSchema, updateTicketSchema, ticketQuerySchema
4. Criar `src/schemas/ai.ts` — summarizeSchema (union: ticketId OU {title, description})

### Fase 4: Autenticação
1. Criar `src/lib/auth.ts` — configuração NextAuth com Credentials provider, estratégia JWT, bcrypt compare
2. Criar `src/app/api/auth/[...nextauth]/route.ts`
3. Criar `src/middleware.ts` — **Importante:** matcher cobre `/tickets/new`, `/tickets/:path*/edit`, `/api/ai/:path*`. Para `/api/tickets/:path*`, a distinção GET (público) vs POST/PATCH (protegido) é tratada **dentro de cada route handler** com checks de `getServerSession()`, não no middleware.

### Fase 5: Camada de AI Provider (Multi-Provider)
1. Criar `src/lib/ai/prompt.ts` — System prompt compartilhado + parser de resultado para todos os providers
2. Criar `src/lib/ai/errors.ts` — classe `AIProviderError` + `extractErrorMessage()` para tratamento unificado de erros entre providers (401, 429, 403, timeout, filtros de segurança, mensagens aninhadas de SDKs)
3. Criar `src/lib/ai/stream-utils.ts` — Utilitários de streaming compartilhados: `chunkText`, `delay`, `simulateStream` — reutilizados pelo MockAIProvider e outros providers
4. Criar `src/lib/ai/mock-provider.ts` — MockAIProvider com simulação de streaming (delay de 50-100ms por chunk via `simulateStream`), resultados determinísticos baseados em keywords
5. Criar `src/lib/ai/openai-provider.ts` — OpenAIProvider usando gpt-4o-mini com streaming, usa `extractErrorMessage` para tratamento de erros
6. Criar `src/lib/ai/anthropic-provider.ts` — AnthropicProvider usando claude-haiku-4-5 com streaming, usa `extractErrorMessage` para tratamento de erros
7. Criar `src/lib/ai/gemini-provider.ts` — GeminiProvider usando gemini-2.0-flash com streaming, usa `extractErrorMessage` para tratamento de erros
8. Criar `src/lib/ai/factory.ts` — getAIProvider(settings, provider?) + getAvailableProviders(settings). Usa `AIProviderError` quando API key está ausente. Suporta seleção de provider em runtime.
9. Criar `src/lib/ai/cache.ts` — lógica de get/set/invalidate de cache. **Invalidação** é chamada no handler PATCH do ticket quando título ou descrição mudam.
10. Criar `src/app/api/ai/providers/route.ts` — endpoint GET retornando providers disponíveis baseado nas API keys configuradas.

### Fase 6: Route Handlers da API + Lógica de Auditoria
1. Criar `src/lib/utils.ts` — helper handleApiError, utilitário cn
2. Criar `src/app/api/tickets/route.ts` — GET (listagem, público, paginado) + POST (criação, protegido, cria AuditLog com action `created`)
3. Criar `src/app/api/tickets/[id]/route.ts` — GET (detalhe, público) + PATCH (atualização, protegido):
   - Calcula diff para cada campo alterado
   - Cria AuditLog: action `status_changed` se status mudou, `updated` caso contrário
   - Armazena mudanças como `{ field: { from, to } }`
   - Chama invalidação de cache se título/descrição mudaram
4. Criar `src/app/api/ai/summarize/route.ts` — POST com streaming SSE:
   - Verifica cache primeiro (por ticketId) → retorna cacheado se válido (sem streaming)
   - Chama AIProvider.generateSummary() → stream via SSE
   - Salva resultado no AICache ao completar

### Fases 7-8: Features de UI (fatias verticais por feature)

**7a. Layout e UI de Auth**
- Instalar componentes shadcn/ui: button, input, textarea, select, badge, card, skeleton, label, dropdown-menu, separator, toast (sonner)
- Criar `src/app/layout.tsx` — layout raiz com SessionProvider, Toaster, fontes, metadata
- Criar `src/components/auth/login-form.tsx`
- Criar `src/components/auth/auth-guard.tsx` — wrapper de verificação de auth client-side
- Criar `src/app/login/page.tsx`
- Criar `src/app/page.tsx` — redirect para /tickets

**7b. Listagem de Tickets**
- Criar `src/components/tickets/status-badge.tsx`
- Criar `src/components/tickets/priority-badge.tsx`
- Criar `src/components/tickets/ticket-card.tsx`
- Criar `src/components/tickets/ticket-filters.tsx` — selects de status/priority, busca com debounce de 300ms
- Criar `src/components/tickets/ticket-list.tsx` — com paginação, skeleton de loading, empty state
- Criar `src/app/tickets/page.tsx` — página de listagem usando os componentes acima

**7c. Criação de Ticket**
- Criar `src/components/tickets/tag-input.tsx` — componente de input com chips/tags
- Criar `src/components/tickets/ticket-form.tsx` — formulário com validação Zod, erros inline
- Criar `src/app/tickets/new/page.tsx` — página de criação com toast de sucesso + redirect

**7d. Detalhe do Ticket + IA + Auditoria**
- Criar `src/components/ai/ai-summary-skeleton.tsx`
- Criar `src/components/ai/ai-summary.tsx` — consumo de SSE, renderização progressiva, indicador de cache
- Criar `src/components/audit/audit-timeline.tsx` — timeline/lista de mudanças (mais recente primeiro)
- Criar `src/components/tickets/ticket-detail.tsx` — visualização completa com mudança de status inline
- Criar `src/app/tickets/[id]/page.tsx` — página de detalhe com botão de resumo IA + timeline de auditoria

**7e. Edição de Ticket**
- Criar `src/app/tickets/[id]/edit/page.tsx` — formulário de edição pré-carregado com valores atuais

### Fase 9: Testes (79 testes, 9 arquivos)
1. Criar `__tests__/setup.ts` — mocks globais (mock do Prisma client, mock de session NextAuth)
2. Criar `__tests__/lib/ai/mock-provider.test.ts` — AIResult válido, chunks de streaming corretos, classificação por keywords
3. Criar `__tests__/lib/ai/factory.test.ts` — retorna MockAIProvider por padrão, valida API keys, lança AIProviderError
4. Criar `__tests__/lib/ai/cache.test.ts` — get/set/invalidate/expiração de TTL
5. Criar `__tests__/lib/ai/errors.test.ts` — AIProviderError, extractErrorMessage (401, 429, 403, timeout, filtros de segurança, mensagens aninhadas)
6. Criar `__tests__/lib/ai/stream-utils.test.ts` — chunkText, delay, simulateStream
7. Criar `__tests__/schemas/ticket.test.ts` — inputs válidos/inválidos, defaults, partial updates
8. Criar `__tests__/schemas/ai.test.ts` — ticketId OU {title,description}, rejeita inválido
9. Criar `__tests__/api/tickets.test.ts` — POST 201, POST 400, GET lista, GET filtrado, PATCH + audit log
10. Criar `__tests__/api/ai-summarize.test.ts` — stream SSE, resposta cacheada, 404 para ticket inexistente

### Fase 10: Painel de Configuração de IA
1. Adicionar model `AIConfig` ao `prisma/schema.prisma` — padrão singleton (id="singleton"), campos para defaultProvider, API keys, modelos, cacheTtlMs
2. Rodar `npx prisma migrate dev --name add-ai-config`
3. Criar `src/lib/ai/settings.ts` — `getAISettings()` (DB > env > default), `maskApiKey()`
4. Refatorar `src/lib/ai/factory.ts` — `getAIProvider(settings, provider?)` e `getAvailableProviders(settings)` recebem settings como parâmetro
5. Refatorar providers (`openai-provider.ts`, `anthropic-provider.ts`, `gemini-provider.ts`) — aceitam `{ apiKey, model }` no constructor
6. Refatorar `src/lib/ai/cache.ts` — `setCachedResult()` aceita parâmetro opcional `cacheTtlMs`
7. Adicionar `aiConfigSchema` ao `src/schemas/ai.ts` — validação Zod para settings
8. Criar `src/app/api/settings/route.ts` — GET (keys mascaradas) + PUT (upsert, ignora valores mascarados)
9. Refatorar `src/app/api/ai/providers/route.ts` — usar `getAISettings()`
10. Refatorar `src/app/api/ai/summarize/route.ts` — usar `getAISettings()` para resolução de provider e cache TTL
11. Criar `src/app/settings/page.tsx` — formulário de settings (select de provider, inputs de API key com toggle de visibilidade, inputs de modelo, cache TTL)
12. Atualizar `src/components/layout/navbar.tsx` — adicionar link de Settings
13. Atualizar `src/middleware.ts` — adicionar `/settings` e `/api/settings` ao matcher + rate limiting
14. Atualizar `__tests__/setup.ts` — adicionar mock de `aIConfig`
15. Atualizar `__tests__/lib/ai/factory.test.ts` — passar parâmetro settings

### Fase 11: Polimento Final e Verificação
1. Verificar `.env.example` está completo
2. `npm run lint` — corrigir erros de lint
3. `npm run build` — TypeScript strict compila sem erros
4. `npm test` — todos os testes passam
5. Teste manual end-to-end: login → criar ticket → listar → filtrar → detalhe → editar → mudar status → gerar resumo IA → verificar timeline de auditoria

## Decisões Técnicas Chave
- NextAuth v4 (estratégia JWT, sem DB adapter para sessions)
- Middleware protege rotas de página; route handlers verificam session internamente para granularidade por método HTTP
- Suporte multi-provider: Mock (padrão), OpenAI, Anthropic, Gemini — selecionável via dropdown na UI
- Painel de configuração de IA: API keys, modelos, provider padrão, cache TTL — configurável via UI, armazenado no banco
- Resolução de settings: DB > env var > default (sem necessidade de redeploy para mudar config de IA)
- MockAIProvider como fallback — determinístico, sem API key necessária
- SSE para streaming de IA (não WebSockets)
- Paginação baseada em offset (page/limit)
- Diff de auditoria computado no handler PATCH, armazenado como JSON
- Cache de IA invalidado ao editar título/descrição do ticket
