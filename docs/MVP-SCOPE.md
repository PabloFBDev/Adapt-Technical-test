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

Funcionalidades extras que demonstram profundidade técnica. São 3 diferenciais (mínimo exigido: 2).

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

### 3. Streaming IA (SSE)
- Endpoint retorna `text/event-stream`
- MockAIProvider simula chunks com delay (50–100ms)
- UI renderiza resultado progressivamente
- Interface `AIProvider` usa `AsyncGenerator` para suportar streaming
- **Complexidade:** Média-alta. Requer SSE no backend + consumo no frontend.

---

## Won't Have (Future Scope)

| Feature | Motivo |
|---------|--------|
| Provider real de IA (OpenAI/Anthropic/Gemini) | Interface plugável está pronta; implementação real é só instanciar. Não agrega pro avaliador sem demonstrar algo novo. |
| Rate limit no endpoint IA | Bom para produção, mas não demonstra habilidade técnica diferenciada num teste. |
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

**Por que MockAIProvider como único provider?**
A interface `AIProvider` é o que importa — demonstra abstração, inversão de dependência e testabilidade. O mock funciona sem API key, facilitando avaliação. Um provider real seria apenas um adapter.

**Por que esses 3 diferenciais?**
- Edição + status: torna o sistema funcional de verdade (sem isso é read-only)
- Auditoria: mostra modelagem de dados e lógica de negócio
- Streaming SSE: mostra domínio de APIs assíncronas e real-time no frontend

Os 3 juntos cobrem backend, modelagem e frontend — boa distribuição de complexidade.

---

## Critérios de Sucesso

O teste é considerado aprovado quando:

1. **Funcional:** Todas as features Must Have funcionam end-to-end
2. **Qualidade:** Código TypeScript strict, sem `any`, validação Zod consistente
3. **Arquitetura:** Separação clara de responsabilidades, AIProvider plugável, tratamento de erro padronizado
4. **Testes:** Testes unitários passando para AIProvider, schemas Zod e Route Handlers
5. **UI:** Interface limpa e moderna (Tailwind + shadcn/ui), com loading/empty/error states
6. **Documentação:** README cobre tudo que o teste exige — setup, testes, decisões, IA
7. **Diferenciais:** 3 diferenciais funcionais e bem implementados
8. **Avaliação rápida:** Avaliador consegue clonar, rodar `npm install && npm run dev` e testar em < 5 minutos
