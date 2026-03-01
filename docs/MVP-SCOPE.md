# MVP-SCOPE — Ops Copilot

## Must Have (Obrigatório)

Funcionalidades exigidas pelo teste técnico. Sem estas, o teste é reprovado.

### CRUD & Listagem
- **Criar ticket** com title, description, priority, tags
- **Listar tickets** com paginação (offset-based)
- **Filtrar** por status, priority e tags
- **Buscar** por title/description (case-insensitive)
- **Página de detalhe** do ticket

### Feature de IA
- Endpoint `POST /api/ai/summarize`
- Interface `AIProvider` com método `generateSummary`
- `MockAIProvider` funcional como fallback (sem API key)
- Retorna: summary, nextSteps, riskLevel, categories
- **Caching** por ticketId em tabela Postgres

### Autenticação
- NextAuth com Credentials (email + senha)
- Rotas de create/edit protegidas
- Login/logout funcional
- Seed de usuário padrão

### Qualidade de Código
- TypeScript strict
- Validação Zod no front e back
- Loading, empty e error states em toda UI
- Tratamento de erro consistente na API
- Testes unitários (Vitest):
  - MockAIProvider (formato de retorno, streaming)
  - Validações Zod (schemas de input)
  - Route Handlers (contratos da API)
- Logs básicos no backend

### Entregáveis
- Repositório público no GitHub
- README completo (visão, arquitetura, setup, testes, IA)
- `.env.example` com todas as variáveis documentadas

---

## Should Have (Diferenciais Escolhidos)

Funcionalidades extras que demonstram profundidade técnica. São 5 diferenciais implementados (mínimo exigido: 2).

### 1. Edição e Mudança de Status
- Endpoint `PATCH /api/tickets/:id` com partial update
- Formulário de edição pré-carregado
- Mudança de status inline na página de detalhe
- **Complexidade:** Baixa. Impacto alto — sem isso o sistema é read-only.

### 2. Auditoria de Mudanças
- Tabela `AuditLog` com diffs por campo (`{ field: { from, to } }`)
- Registro automático em criação e edição
- Timeline de auditoria na página de detalhe do ticket
- **Complexidade:** Média. Requer lógica de diff e UI de timeline.

### 3. Rate Limiting
- Sliding window in-memory por IP no middleware
- 3 tiers configuráveis: auth (10/min), AI (20/min), tickets (60/min), settings (20/min)
- Retorna 429 com header `Retry-After`
- **Complexidade:** Baixa-média. Proteção essencial contra abuso.

### 4. Streaming IA (SSE) com Multi-Provider
- Endpoint retorna `text/event-stream`
- **4 providers implementados**: Mock, OpenAI (gpt-4o-mini), Anthropic (claude-haiku-4-5), Gemini (gemini-2.0-flash)
- **Seletor de provider na UI** — dropdown na página de detalhe do ticket
- Endpoint `GET /api/ai/providers` retorna providers disponíveis (baseado nas API keys)
- UI renderiza resultado progressivamente
- Interface `AIProvider` usa `AsyncGenerator` para suportar streaming
- **Tratamento de erros robusto**: módulo `errors.ts` com `AIProviderError` e `extractErrorMessage`; eventos de erro propagados via stream (`{ type: "error", message }`)
- **Utilitários compartilhados**: módulo `stream-utils.ts` com `chunkText`, `delay`, `simulateStream` — reutilizados entre providers
- **Complexidade:** Alta. Requer SSE no backend + consumo no frontend + integração com 3 APIs externas.

### 5. Painel de Configuração de IA (`/settings`)
- Página de configurações para gerenciar providers de IA **sem editar `.env` ou fazer redeploy**
- Configuração de API keys (mascaradas na exibição), modelos, provider padrão e cache TTL
- Persistência em Postgres (tabela `AIConfig` singleton) com prioridade DB > env var > default
- API `GET /api/settings` (keys mascaradas) + `PUT /api/settings` (upsert)
- **Complexidade:** Média. Requer model Prisma, API route, Zod schema, UI de formulário e lógica de mascaramento.

---

## Won't Have (Future Scope)

| Feature | Motivo |
|---------|--------|
| ~~Provider real de IA~~ | **Implementado.** OpenAI, Anthropic e Gemini com seleção via UI. |
| ~~Config via UI~~ | **Implementado.** Painel `/settings` para API keys, modelos, provider padrão e cache TTL. |
| ~~Rate limit~~ | **Implementado.** Sliding window in-memory por IP, 3 tiers (auth, AI, tickets, settings). |
| RAG com base local | Alta complexidade vs. tempo disponível. Não é core do teste. |
| Observabilidade (métricas, tracing) | Escopo de infra, não de aplicação. |
| Docker compose | Supabase é hosted — não precisa de container local para o banco. |
| Deploy Vercel + link | Pode ser feito no final se sobrar tempo, mas não é prioridade sobre qualidade de código. |
| Ownership de tickets | Simplifica o escopo — qualquer usuário autenticado pode editar qualquer ticket. |
| Soft delete | Tickets não são deletados neste MVP. |
| Notificações / webhooks | Fora do escopo. |
| Multi-tenancy | Single-tenant neste MVP. |

---

## Justificativa das Decisões de Escopo

**Por que Supabase + Prisma?**
Supabase dá Postgres hosted sem Docker. Prisma dá migrations explícitas, type-safety e é o ORM mais comum no ecossistema Next.js. O avaliador vê schema declarativo e migrations versionadas.

**Por que NextAuth Credentials?**
É a solução mais robusta dentre as opções permitidas. Tem session handling, CSRF protection, e JWT built-in. Credentials provider é simples de implementar e o avaliador conhece o padrão.

**Por que multi-provider com seleção via UI?**
A interface `AIProvider` define o contrato. 4 providers estão implementados (Mock, OpenAI, Anthropic, Gemini). O Mock funciona sem API key, facilitando avaliação. Providers reais são habilitados ao configurar a API key correspondente no `.env`. O seletor na UI permite comparar resultados de diferentes providers em tempo real.

**Por que esses 5 diferenciais?**
- Edição + status: torna o sistema funcional de verdade (sem isso é read-only)
- Auditoria: mostra modelagem de dados e lógica de negócio
- Rate limiting: proteção essencial contra abuso, especialmente em endpoints de IA
- Streaming SSE: mostra domínio de APIs assíncronas e real-time no frontend
- Painel de configuração: mostra integração completa (Prisma model, API route, Zod schema, UI, segurança de API keys)

Os 5 juntos cobrem backend, modelagem, frontend, segurança e operações — boa distribuição de complexidade.

---

## Critérios de Sucesso

O teste é considerado aprovado quando:

1. **Funcional:** Todas as features Must Have funcionam end-to-end
2. **Qualidade:** Código TypeScript strict, sem `any`, validação Zod consistente
3. **Arquitetura:** Separação clara de responsabilidades, AIProvider plugável, tratamento de erro padronizado
4. **Testes:** Testes unitários passando para AIProvider, schemas Zod e Route Handlers
5. **UI:** Interface limpa e moderna (Tailwind + shadcn/ui), com loading/empty/error states
6. **Documentação:** README cobre tudo que o teste exige — setup, testes, decisões, IA
7. **Diferenciais:** 5 diferenciais funcionais e bem implementados
8. **Avaliação rápida:** Avaliador consegue clonar, rodar `npm install && npm run dev` e testar em < 5 minutos
