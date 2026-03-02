# Decisões Técnicas

Esse documento registra as decisões técnicas do projeto, trazendo os tradeoffs e o que funcionou, o que escolhi deixar de fora, e onde eu faria diferente com mais tempo.

## 1. STACK

- Next.js 16 + App Router.
- TypeScript com `strict: true`.
- Supabase (Postgres) como banco, pois resolve o problema de infra facilmente. O tradeoff é pela latência de rede, mas ressalto que no Vercel configurei o connection pooling com PgBouncer pra mitigar isso e também obviamente é preciso criar uma conta no Supabase.
- Prisma como ORM, pois resolve o problema de type safety e migrations versionadas.
- NextAuth com Credentials e JWT: dado que o teste não especificou tipo de autenticação optei por e-mail e senha, sem depender de OAuth externo.
- Tailwind CSS + shadcn/ui.
- Zod para validação e schemas.
- Vitest para testes: mais rápido que Jest, suporte nativo a ESM e configuração zero com TypeScript.

## 2. ARQUITETURA

### Monolito Full-Stack

O teste pedia explicitamente backend dentro do Next com Route Handlers. Mas pensei se o projeto crescesse, a separação já existe conceitualmente: `src/lib/` é puro backend, `src/components/` é puro frontend, por tanto seria uma refatoração de extração e não de reestruturação.

### Estrutura de pastas

```
Estrutura do Projeto
└── src
    ├── app
    │   └── Rotas e páginas (apresentação e transporte)
    ├── components
    │   └── Componentes React
    ├── lib
    │   └── Lógica de negócio e integrações
    ├── schemas
    │   └── Schemas Zod compartilhados entre front e back
    ├── types
    │   └── Tipos TypeScript do domínio
    └── middleware.ts
        └── Auth e rate limiting
```

## 3. IA

### Factory + Provider

A interface `AIProvider` define o contrato. Implementei quatro providers:

- `MockAIProvider` = sem API key, funciona como fallback e pra testes
- `OpenAIProvider` = usa `gpt-4o-mini`, modelo configurável via `OPENAI_MODEL`
- `AnthropicProvider` = usa `claude-haiku-4-5-20251001`, configurável via `ANTHROPIC_MODEL`
- `GeminiProvider` = usa `gemini-2.0-flash`, configurável via `GEMINI_MODEL`

O factory `getAIProvider(settings, provider?)` resolve qual implementação usar baseado nas configurações e, opcionalmente faz um override via UI. O `getAvailableProviders(settings)` retorna só os providers que têm API key configurada e alimenta o dropdown no frontend.

### Módulos compartilhados

- `errors.ts` - tem a classe `AIProviderError` e a função `extractErrorMessage` que traduz erros de API (401, 429, timeout, filtros de segurança) em mensagens legíveis em PT-BR.
- `stream-utils.ts` - `chunkText`, `delay` e `simulateStream`, reutilizados pelo Mock e outros providers.

O `AIStreamChunk` inclui tipo `"error"`, então erros podem ser propagados via stream sem quebrar a conexão SSE.

### Mock inteligente

O `MockAIProvider` não retorna dado fixo, ele lê keywords do título:

- "bug", "error", "crash" -> `riskLevel: "high"`, categoria bug
- "feature", "request" -> `riskLevel: "low"`, categoria feature

Summary e nextSteps são gerados contextualmente, onde permite criar tickets diferentes e ver comportamentos diferentes, que é o que importa pra demonstrar a feature.

### Cache no Postgres com TTL

Cache de IA vai pro Postgres via Prisma. A decisão foi pela simplicidade: sem mais uma dependência de infra (Redis), o cache é transacional onde posso invalidar junto com a operação de atualizar o ticket, e tem TTL via o campo `expiresAt`.

Quando título ou descrição mudam no `PATCH`, o cache é invalidado automaticamente. Na próxima visualização, a IA reprocessa. TTL padrão de 1 hora, configurável via `AI_CACHE_TTL_MS` ou pelo painel `/settings`. Um cache por ticketId - relação 1:1 no banco.

### Painel de Configuração (`/settings`)

- Página pra gerenciar providers sem tocar no `.env`.
- API keys mascaradas na exibição.
- Persistência em Postgres com prioridade DB > env var > default. Se a key vier mascarada no PUT (está inalterada), não sobrescreve o valor real no banco.

### Por que não RAG ou Docker?

RAG exigiria vector database e embedding model, complexidade desproporcional ao ganho pra um MVP. Docker faria mais sentido com banco local; com Supabase hosted, só adicionaria complexidade no setup.

## 4. COMPONENTIZAÇÃO

### Hierarquia

```
Layout
└── Navbar
└── Conteúdo da Página
    ├── TicketStats
    ├── TicketFilters
    ├── TicketList -> TicketCard × N
    ├── TicketDetail
    │   ├── AISummary (streaming SSE)
    │   └── AuditTimeline
    └── TicketForm (create/edit)
```

### Server vs Client - critério que usei

Server -> usado quando o componente só busca e renderiza dados, sem interação.
Ex: página que busca os dados no banco com Prisma.

Client -> usado quando o componente precisa de interação, ex:

- useState, useEffect, useSession, ou seja, hooks do React.
- Eventos de clique, submit, etc.
- Streaming SSE - pois precisa de useEffect para ler o stream e atualizar o estado.
- Formulários.
- Filtros que atualizam a URL e disparam fetch.

### Data fetching

- Server Components: Prisma direto.
- Client Components: `fetch()` para API routes, `useEffect` para lifecycle.
- `AbortController` em todos os fetches para evitar race conditions, memory leaks e dados stale.
- Filtros via URL com `useSearchParams()` + `router.push()`, bookmarkable e shareable.
- Debounce de 300ms na busca para evitar request a cada keystroke.

## 5. QUALIDADE

### Tratamento de erros centralizado

`handleApiError()` em `src/lib/utils.ts` é chamada em todos os route handlers:

- `ZodError` -> 400 com detalhes por campo
- `NotFoundError` -> 404
- Qualquer outro -> 500 + log estruturado

No frontend, cada componente que faz fetch tem três estados visuais distintos: loading com skeleton, empty com mensagem e error com alerta vermelho + botão de retry. Toast via Sonner pra feedback de ações.

### Logger estruturado

Output JSON com timestamp, level, message e metadata. Integrado ao `handleApiError()`, erros 500 são logados com stack trace. Não adicionei APM (Sentry, Datadog) porque seria over-engineering, mas o logger já está no formato certo para essas ferramentas se o projeto fosse crescer.

### Testes

Prisma é mockado via `vi.mock`, testes não tocam banco real e são rápidos e isolados.

## 6. SEGURANÇA

- Security headers no `next.config.ts`: HSTS, X-Content-Type-Options, X-Frame-Options, CSP, Permissions-Policy (linha OWASP).
- Auth em todas as rotas de escrita: middleware + verificação no handler (defense in depth).
- Sem ownership check: qualquer autenticado edita qualquer ticket, decisão consciente pra modelo colaborativo de helpdesk onde teria várias pessoas trabalhando nos mesmos tickets. Pensei também em adicionar locking pra evitar overwrites acidentais mas não implementei.
- Rate limiting em 4 tiers: auth (10/min), AI (20/min), settings (20/min), tickets (60/min).
- Validação Zod no server.
- Bcryptjs com salt 10 - sem senhas em plain text.
- Validação de variáveis de ambiente no startup via `src/lib/env.ts`, falha cedo se algo estiver faltando.

## 7. DIFERENCIAIS

O teste pedia 2+. Implementei 5.

### 1. Edição e mudança de status

- PATCH com partial update, formulário pré-carregado, dropdown inline de status sem precisar ir à página de edit.

### 2. Auditoria de mudanças

- Model `AuditLog` com diffs por campo.
- Registro via Prisma transaction junto com a operação principal.
- Timeline visual com cor por tipo de ação (created, updated, status_changed).

### 3. Rate limiting

- Sliding window in-memory por IP, configurável por rota e retorna 429 com `Retry-After`.

### 4. Streaming SSE com Multi-Provider

`ReadableStream` + `text/event-stream`. Quatro providers com dropdown de seleção na UI e endpoint que retorna só os disponíveis baseado nas keys configuradas. Erros propagados via stream sem quebrar a conexão.

### 5. Painel de Configuração de IA

- Página pra gerenciar providers sem tocar no `.env`.
- API keys mascaradas na exibição.
- Persistência em Postgres com prioridade DB > env var > default. Se a key vier mascarada no PUT (está inalterada), não sobrescreve o valor real no banco.

## 8. AUDITORIA PÓS-IMPLEMENTAÇÃO

Depois de fechar a implementação de forma geral, fiz uma rodada de auditoria focada em performance e qualidade.

### Índices de banco de dados

Adicionei índices para todas as colunas usadas em WHERE/ORDER BY/JOIN:

- `Ticket`: `status`, `priority`, `createdAt`, `userId`
- `AuditLog`: composto `[ticketId, createdAt]`, `userId`

### AbortController em todos os fetches

Todos os componentes client-side usam `AbortController` com cleanup no unmount - previne race conditions, memory leaks e dados stale quando o usuário navega rapidamente ou muda filtros.

### Cache in-memory para AISettings

`getAISettings()` usa cache com TTL de 5 minutos, invalidado automaticamente ao salvar configurações via `/settings`.

### Paginação de audit logs

Queries de audit logs limitadas a 20 registros mais recentes para evitar payloads ilimitados em tickets com muitas edições.

### React.memo no TicketCard

Componente memoizado para evitar re-renders desnecessários durante paginação e mudanças de loading state.

## 9. FERRAMENTAS DE DESENVOLVIMENTO

Usei o Claude Code (CLI da Anthropic) como ferramenta de apoio à implementação.

### Product Discovery

Antes de iniciar a etapa de desenvolvimento, criei um processo de Product Discovery:

- Analisando o teste proposto
- Definindo os requisitos funcionais e não funcionais
- Decisões de arquitetura e stack (stack já havia algumas obrigatórias)
- Criei o escopo mínimo viável (MVP) e os diferenciais que implementaria além do pedido após o MVP

Todas as decisões estratégicas, definição de escopo, arquitetura, modelagem de dados e organização do projeto foram tomadas por mim durante essa etapa.
