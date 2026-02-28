# PRD — Ops Copilot

## Visão Geral

Ops Copilot é um sistema de registro de tarefas e incidentes com geração automática de resumos e sugestões por IA. O usuário cria tickets, filtra e busca por eles, e pode gerar análises automáticas com próximos passos, nível de risco e categorização — tudo via uma interface limpa e moderna.

O sistema usa NextAuth para autenticação, Supabase (Postgres) com Prisma como ORM, e uma arquitetura de AI Provider plugável com MockAIProvider como fallback padrão.

---

## Entidade Principal: Ticket

### Schema

| Campo       | Tipo                              | Regras                                      |
|-------------|-----------------------------------|---------------------------------------------|
| id          | UUID                              | Gerado automaticamente (cuid ou uuid)       |
| title       | String                            | Obrigatório, 3–120 caracteres               |
| description | Text                              | Obrigatório, 10–5000 caracteres             |
| status      | Enum: `open` `in_progress` `done` | Default: `open`                             |
| priority    | Enum: `low` `medium` `high`       | Obrigatório                                 |
| tags        | String[]                          | 0–10 tags, cada uma com 1–30 caracteres     |
| createdAt   | DateTime                          | Gerado automaticamente                      |
| updatedAt   | DateTime                          | Atualizado automaticamente                  |
| userId      | String                            | FK para User, preenchido via session         |

### Entidade: AuditLog

| Campo      | Tipo     | Regras                                     |
|------------|----------|--------------------------------------------|
| id         | UUID     | Gerado automaticamente                     |
| ticketId   | String   | FK para Ticket                             |
| userId     | String   | FK para User (quem fez a mudança)          |
| action     | Enum: `created` `updated` `status_changed` | Tipo da ação |
| changes    | JSON     | `{ field: { from: old, to: new } }`        |
| createdAt  | DateTime | Gerado automaticamente                     |

### Entidade: AICache

| Campo      | Tipo     | Regras                                     |
|------------|----------|--------------------------------------------|
| id         | UUID     | Gerado automaticamente                     |
| ticketId   | String   | FK para Ticket (unique)                    |
| result     | JSON     | AIResult completo (summary, nextSteps, etc)|
| createdAt  | DateTime | Gerado automaticamente                     |
| expiresAt  | DateTime | createdAt + 1 hora (TTL configurável)      |

---

## Funcionalidades Obrigatórias

### 1. Criar Ticket

**Rota:** `POST /api/tickets`

**Campos do formulário:**
- `title` — input text, obrigatório
- `description` — textarea, obrigatório
- `priority` — select (`low`, `medium`, `high`), obrigatório
- `tags` — input com chips/tags, opcional

**Validação (Zod):**
```typescript
const createTicketSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(5000),
  priority: z.enum(["low", "medium", "high"]),
  tags: z.array(z.string().min(1).max(30)).max(10).default([]),
});
```

**Regras:**
- `status` sempre inicia como `open`
- `userId` vem da session (não do body)
- Rota protegida (requer autenticação)
- Ao criar, gera um registro em `AuditLog` com action `created`
- Retorna o ticket criado com status `201`

**Critérios de aceitação:**
- [ ] Formulário valida campos antes de submeter
- [ ] Campos inválidos mostram mensagem de erro inline
- [ ] Após criação, redireciona para a listagem ou detalhe do ticket
- [ ] Toast/notificação de sucesso

---

### 2. Editar Ticket e Mudar Status (Diferencial)

**Rota:** `PATCH /api/tickets/:id`

**Campos editáveis:**
- `title`, `description`, `priority`, `tags`, `status`

**Validação (Zod):**
```typescript
const updateTicketSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().min(10).max(5000).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  tags: z.array(z.string().min(1).max(30)).max(10).optional(),
  status: z.enum(["open", "in_progress", "done"]).optional(),
});
```

**Regras:**
- Rota protegida
- Só envia campos que mudaram
- Cada campo alterado gera um registro em `AuditLog` com o diff `{ field: { from, to } }`
- Se `status` mudou, action é `status_changed`; caso contrário, `updated`
- Invalida cache de IA se `title` ou `description` mudaram
- Retorna o ticket atualizado

**Critérios de aceitação:**
- [ ] Formulário de edição pré-carrega valores atuais
- [ ] Mudança de status pode ser feita inline (dropdown ou botões na página de detalhe)
- [ ] Auditoria registra todas as mudanças
- [ ] Cache de IA é invalidado quando título ou descrição mudam

---

### 3. Listar Tickets

**Rota:** `GET /api/tickets`

**Query params:**
| Param    | Tipo   | Default    |
|----------|--------|------------|
| page     | number | 1          |
| limit    | number | 10         |
| status   | string | (todos)    |
| priority | string | (todos)    |
| tags     | string | (todos) — comma-separated |
| search   | string | (vazio)    |
| sortBy   | string | `createdAt`|
| order    | string | `desc`     |

**Resposta:**
```typescript
{
  data: Ticket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}
```

**Regras:**
- Busca (`search`) faz `LIKE` em `title` e `description` (case-insensitive)
- Filtro de `tags` retorna tickets que contenham QUALQUER uma das tags informadas
- Paginação baseada em offset (page/limit)

**Critérios de aceitação:**
- [ ] Listagem mostra título, status (badge colorido), priority, tags e data
- [ ] Filtros de status e priority funcionam como selects ou toggle buttons
- [ ] Busca tem debounce de ~300ms
- [ ] Empty state quando não há resultados
- [ ] Loading skeleton durante carregamento
- [ ] Paginação funcional com indicação de página atual e total

---

### 4. Página de Detalhe do Ticket

**Rota (page):** `/tickets/[id]`  
**Rota (API):** `GET /api/tickets/:id`

**Exibe:**
- Todos os campos do ticket
- Botão para gerar resumo IA
- Resumo IA (se já gerado/cacheado)
- Histórico de auditoria (lista de mudanças)
- Botões para editar e mudar status

**Critérios de aceitação:**
- [ ] Mostra todas as informações do ticket com boa hierarquia visual
- [ ] Botão "Gerar Resumo IA" dispara o endpoint e mostra resultado com streaming
- [ ] Se há cache válido, mostra resultado cacheado com indicação de "gerado em [data]"
- [ ] Histórico de auditoria em timeline ou lista ordenada (mais recente primeiro)
- [ ] Loading state enquanto carrega o ticket
- [ ] Error state se ticket não existe (404)

---

## Feature de IA

### Endpoint: `POST /api/ai/summarize`

**Entrada (Zod):**
```typescript
const summarizeSchema = z.union([
  z.object({ ticketId: z.string().cuid() }),
  z.object({
    title: z.string().min(3).max(120),
    description: z.string().min(10).max(5000),
  }),
]);
```

**Saída (`AIResult`):**
```typescript
interface AIResult {
  summary: string;       // 3–6 linhas
  nextSteps: string[];   // 3–7 itens
  riskLevel: "low" | "medium" | "high";
  categories: string[];  // ex: ["bug", "incident", "feature"]
}
```

**Fluxo:**
1. Recebe request
2. Se `ticketId`: busca ticket no banco; se não encontrar, retorna 404
3. Verifica cache (`AICache`) — se válido, retorna cacheado (sem streaming)
4. Chama `AIProvider.generateSummary()` via streaming (SSE)
5. Ao final do streaming, salva resultado no cache
6. Retorna resultado via SSE (event stream)

**Streaming (SSE) — Diferencial:**
- Response com `Content-Type: text/event-stream`
- Eventos: `data: { type: "chunk", field: "summary", content: "..." }`
- Evento final: `data: { type: "done", result: AIResult }`
- MockAIProvider simula chunks com delay de 50–100ms entre cada um

### Interface AIProvider

```typescript
interface AIProvider {
  generateSummary(input: { title: string; description: string }): AsyncGenerator<AIStreamChunk>;
}

type AIStreamChunk =
  | { type: "chunk"; field: keyof AIResult; content: string }
  | { type: "done"; result: AIResult };
```

### MockAIProvider

**Comportamento:**
- Retorna dados determinísticos baseados no input (usa keywords do título/descrição)
- Simula streaming com delay de 50–100ms por chunk
- Se título contém "bug" ou "error" → `riskLevel: "high"`, categories inclui `"bug"`
- Se título contém "feature" ou "request" → `riskLevel: "low"`, categories inclui `"feature"`
- Default: `riskLevel: "medium"`, categories `["task"]`
- Gera `summary` de 3–4 frases genéricas baseadas no input
- Gera `nextSteps` de 3–5 itens

### AIProviderFactory

```typescript
function getAIProvider(): AIProvider {
  if (process.env.AI_PROVIDER === "openai" && process.env.OPENAI_API_KEY) {
    return new OpenAIProvider();
  }
  // ...outros providers futuros
  return new MockAIProvider();
}
```

### Caching

- Cache em tabela `AICache` (Postgres via Prisma)
- TTL de 1 hora (configurável via `AI_CACHE_TTL_MS` env)
- Cache invalidado quando ticket é editado (title ou description mudam)
- Request com `ticketId` verifica cache antes de chamar provider
- Request sem `ticketId` (title + description direto) não usa cache

---

## Autenticação

### Estratégia: NextAuth (Credentials)

**Provider:** Credentials com email + senha

**Fluxo:**
1. Usuário acessa `/login`
2. Informa email + senha
3. NextAuth valida contra tabela `User` (senha com bcrypt)
4. Cria session (JWT strategy)
5. Redireciona para `/tickets`

**Seed de usuário:**
- Email: `admin@opsCopilot.com`
- Senha: `password123`
- Script de seed cria este usuário automaticamente

**Rotas protegidas (middleware):**
- `POST /api/tickets` — criar
- `PATCH /api/tickets/:id` — editar
- `POST /api/ai/summarize` — gerar resumo
- `/tickets/new` — página de criação
- `/tickets/[id]/edit` — página de edição

**Rotas públicas:**
- `GET /api/tickets` — listar
- `GET /api/tickets/:id` — detalhe
- `/login` — página de login
- `/tickets` — listagem (visualização)

---

## User Stories

1. Como **usuário autenticado**, quero **criar um ticket** com título, descrição, prioridade e tags para **registrar um incidente ou tarefa**.

2. Como **usuário**, quero **ver a lista de tickets** com filtros e busca para **encontrar rapidamente o que procuro**.

3. Como **usuário**, quero **acessar o detalhe de um ticket** para **ver todas as informações e o histórico de mudanças**.

4. Como **usuário autenticado**, quero **editar um ticket e mudar seu status** para **manter o registro atualizado**.

5. Como **usuário autenticado**, quero **gerar um resumo IA de um ticket** para **entender rapidamente o contexto, riscos e próximos passos**.

6. Como **usuário**, quero **ver o resumo IA em tempo real (streaming)** para **ter feedback imediato enquanto a IA processa**.

7. Como **usuário**, quero **ver o histórico de auditoria de um ticket** para **saber quem mudou o quê e quando**.

8. Como **usuário não autenticado**, quero **ser redirecionado para login ao tentar criar/editar** para **que o sistema seja seguro**.

---

## Requisitos Não-Funcionais

- **Performance:** Listagem de tickets deve responder em < 500ms para até 1000 tickets
- **Validação:** Toda entrada de dados validada com Zod no front (antes de submit) e no back (antes de persistir)
- **Error handling:** Padrão consistente de resposta de erro: `{ error: string, details?: unknown }`
- **Loading states:** Skeleton ou spinner em toda operação assíncrona
- **Empty states:** Mensagem clara quando não há resultados (listagem, filtros, busca)
- **Error states:** Mensagem de erro amigável + opção de retry quando aplicável
- **Responsividade:** Layout funcional em desktop e mobile (mínimo)

---

## Edge Cases

| Cenário | Comportamento Esperado |
|---------|----------------------|
| Criar ticket com tags duplicadas | Deduplica automaticamente |
| Editar ticket sem mudar nada | Não gera audit log, retorna ticket sem alteração |
| Gerar IA para ticket inexistente | Retorna 404 com mensagem clara |
| Gerar IA com cache válido | Retorna resultado cacheado sem chamar provider |
| Gerar IA com cache expirado | Chama provider novamente e atualiza cache |
| Busca com string vazia | Retorna todos os tickets (sem filtro de busca) |
| Filtrar por tag que não existe | Retorna lista vazia com empty state |
| Acessar rota protegida sem auth | Redireciona para `/login` (pages) ou retorna 401 (API) |
| Editar ticket de outro usuário | Permitido (não há ownership neste MVP) |
| Título com caracteres especiais | Aceito normalmente, sanitizado na exibição |
| Paginação além do total | Retorna lista vazia |
| Concurrent edit no mesmo ticket | Last-write-wins (sem lock otimístico neste MVP) |
