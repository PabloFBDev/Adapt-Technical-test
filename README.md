# Ops Copilot

Sistema de registro de tarefas e incidentes com geração automática de resumos, próximos passos e análise de risco por IA. Criado como teste técnico Full-Stack TypeScript.

---

## Visão do Produto

Ops Copilot permite que equipes de operações registrem tickets de incidentes e tarefas, acompanhem seu status e obtenham análises automáticas via IA. O sistema oferece busca, filtros por status/prioridade/tags, edição com auditoria de mudanças e geração de resumos com streaming em tempo real.

---

## Arquitetura

```
┌─────────────────────────────────────────────────┐
│              Frontend (Next.js App Router)       │
│  Pages • Components • Settings UI • Middleware   │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│           Backend (Next.js Route Handlers)       │
│  /api/tickets • /api/ai/* • /api/settings •      │
│  /api/auth/register • Auth                       │
└──────┬────────────────┬─────────────────────────┘
       │                │
┌──────▼──────┐  ┌──────▼──────────────────────┐
│  Prisma ORM │  │  AI Provider Layer           │
│             │  │  Settings → Factory →        │
└──────┬──────┘  │  Mock/OpenAI/Anthropic/      │
       │         │  Gemini + Cache (PG)         │
┌──────▼──────┐  │  Errors + Stream Utils       │
│  Supabase   │  └─────────────────────────────┘
│  (Postgres) │
└─────────────┘
```

---

## Decisões Técnicas

| Decisão   | Escolha                   | Motivo                                                            |
| --------- | ------------------------- | ----------------------------------------------------------------- |
| Framework | Next.js 14+ (App Router)  | Exigido. RSC, layouts, route handlers integrados.                 |
| ORM       | Prisma                    | Type-safety, migrations versionadas, boa integração com Postgres. |
| Banco     | Supabase (Postgres)       | Hosted, sem Docker, connection string simples.                    |
| Auth      | NextAuth (Credentials)    | JWT strategy, registro público, middleware de proteção.           |
| UI        | Tailwind + shadcn/ui      | Componentes acessíveis, estilo clean.                             |
| Validação | Zod                       | Schemas compartilhados front/back, type inference.                |
| Testes    | Vitest                    | ESM nativo, rápido, integração natural com TypeScript.            |
| IA        | Multi-provider (plugável) | OpenAI, Anthropic, Gemini + Mock. Seleção via UI ou env var.      |
| Config IA | Painel de settings na UI  | API keys, modelos e provider padrão gerenciados via banco (sem redeploy). |
| Streaming | SSE (Server-Sent Events)  | Nativo do browser, sem websocket, boa DX.                         |

---

## Diferenciais Implementados

### 1. Edição e Mudança de Status

- Endpoint `PATCH /api/tickets/:id` com partial update — qualquer usuário autenticado pode editar qualquer ticket
- Formulário de edição pré-carregado com valores atuais
- Mudança de status inline na página de detalhe (dropdown)

### 2. Auditoria de Mudanças

- Tabela `AuditLog` com diffs por campo (`{ field: { from, to } }`)
- Registro automático em criação e edição
- Timeline de auditoria na página de detalhe do ticket

### 3. Rate Limiting

- Sliding window in-memory por IP com limites por rota (auth: 10/min, AI: 20/min, tickets: 60/min)
- Retorna `429 Too Many Requests` com header `Retry-After`

### 4. Streaming IA (SSE) com Multi-Provider

- Endpoint retorna `text/event-stream`
- Suporte a **4 providers**: Mock, OpenAI, Anthropic (Claude) e Google Gemini
- **Seletor de provider na UI** — o usuario escolhe qual IA usar em tempo real
- Endpoint `GET /api/ai/providers` retorna providers disponiveis (baseado nas API keys configuradas)
- UI renderiza resultado progressivamente (summary, nextSteps, riskLevel, categories)
- Stream reader com `AbortController` — cancela streaming automaticamente ao desmontar componente
- **Tratamento de erros robusto**: módulo `errors.ts` com `AIProviderError` e `extractErrorMessage` — trata erros de API (401, 429, 403), timeout, filtros de segurança e mensagens aninhadas de SDKs
- **Utilitários de streaming compartilhados**: módulo `stream-utils.ts` com `chunkText`, `delay` e `simulateStream` — reutilizados entre providers

### 5. Painel de Configuracao de IA

- **Pagina `/settings`** para gerenciar providers de IA sem editar env vars ou fazer redeploy
- Configuracao de API keys, modelos e provider padrao via UI
- API keys mascaradas no GET (nunca expostas completas na UI)
- Persistencia em Postgres (tabela `AIConfig` singleton) com fallback para env vars
- Cache TTL configuravel via UI
- Prioridade: DB > env var > default

---

## Performance e Escalabilidade

### Índices de banco de dados

Índices adicionados para todas as colunas usadas em WHERE/ORDER BY/JOIN:
- `Ticket`: `status`, `priority`, `createdAt`, `userId`
- `AuditLog`: composto `[ticketId, createdAt]`, `userId`

### AbortController em todos os fetches

Todos os componentes client-side usam `AbortController` com cleanup no unmount — previne race conditions, memory leaks e dados stale quando o usuário navega rapidamente ou muda filtros.

### Cache in-memory para AISettings

`getAISettings()` usa cache com TTL de 5 minutos, invalidado automaticamente ao salvar configurações via `/settings`.

### Paginação de audit logs

Queries de audit logs limitadas a 20 registros mais recentes para evitar payloads ilimitados em tickets com muitas edições.

### React.memo no TicketCard

Componente memoizado para evitar re-renders desnecessários durante paginação e mudanças de loading state.

---

## Como Rodar Local

### Pré-requisitos

- Node.js 18+
- npm
- Conta no [Supabase](https://supabase.com) (free tier funciona)

### Setup

```bash
# 1. Clonar o repositório
git clone <repo-url>
cd ops-copilot

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do Supabase

# 4. Rodar migrations do Prisma
npx prisma migrate dev

# 5. Rodar seed (cria usuário padrão + tickets de exemplo)
npx prisma db seed

# 6. Iniciar o servidor de desenvolvimento
npm run dev
```

O app estará disponível em `http://localhost:3000`.

### Acesso

**Criar conta nova (recomendado):**

Acesse `http://localhost:3000/register` e crie sua própria conta. Após o registro, o login é feito automaticamente.

**Conta do seed (admin):**

- Email: `admin@opscopilot.com`
- Senha: `password123`

---

## Como Rodar Testes

```bash
# Rodar todos os testes
npm test

# Rodar com coverage
npm run test:coverage

# Rodar testes específicos
npx vitest run __tests__/lib/ai/mock-provider.test.ts
```

### O que é testado (79 testes, 9 arquivos)

- **AIProvider:** MockAIProvider retorna AIResult válido, streaming emite chunks corretos, keyword-based classification, factory resolve provider com settings
- **AI Errors:** `AIProviderError`, `extractErrorMessage` — tratamento de erros de API (401, 429, 403), timeout, filtros de segurança
- **AI Stream Utils:** `chunkText`, `delay`, `simulateStream` — utilitários compartilhados de streaming
- **AI Cache:** get/set/invalidate, TTL expiry, TTL dinamico via settings
- **Schemas Zod:** Validacao de criacao/edicao de ticket, query params, input do summarize, config de IA
- **Route Handlers:** Contratos da API (status codes, formato de resposta, validacao de input, auditoria)

---

## Como Usar IA

### Providers disponíveis

O sistema suporta **4 providers de IA**, selecionáveis via UI ou variável de ambiente:

| Provider   | Modelo padrão              | Variável de ambiente |
| ---------- | -------------------------- | -------------------- |
| Mock       | — (determinístico)         | —                    |
| OpenAI     | `gpt-4o-mini`              | `OPENAI_API_KEY`     |
| Anthropic  | `claude-haiku-4-5-20251001`| `ANTHROPIC_API_KEY`  |
| Gemini     | `gemini-2.0-flash`         | `GEMINI_API_KEY`     |

### Selecao de provider via UI

Na pagina de detalhe do ticket, um **seletor dropdown** permite escolher qual provider usar para gerar o resumo. O seletor exibe apenas providers cujas API keys estao configuradas. O Mock esta sempre disponivel.

### Painel de Configuracao (`/settings`)

A pagina de configuracoes permite gerenciar toda a integracao de IA **sem editar `.env` ou fazer redeploy**:

- **Provider padrao**: selecionar qual provider usar por padrao (mock/openai/anthropic/gemini)
- **API keys**: inserir, atualizar ou remover API keys de cada provider (mascaradas na exibicao)
- **Modelos**: configurar qual modelo usar em cada provider
- **Cache TTL**: ajustar tempo de cache dos resultados de IA

As configuracoes sao salvas em Postgres (tabela `AIConfig`) e tem prioridade sobre env vars. Se nada estiver configurado no banco, o sistema usa env vars como fallback.

### Comportamento padrao (sem API key)

Sem nenhuma API key configurada (nem no banco nem no `.env`), o sistema usa `MockAIProvider` automaticamente. O mock:

- Retorna dados determinísticos baseados em keywords do ticket
- Simula streaming com delay de 50-100ms por chunk
- Classifica risco como `high` se o título contém "bug" ou "error"
- Classifica como `low` se contém "feature" ou "request"
- Funciona sem configuração adicional

### Configurando providers reais

Ha **duas formas** de configurar providers reais:

**1. Via UI (recomendado):** Acesse `/settings` e insira as API keys diretamente. As configuracoes sao salvas no banco e persistem entre deploys.

**2. Via env vars (fallback):** Adicione as API keys no `.env`:

```bash
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GEMINI_API_KEY="..."
```

**Prioridade de resolucao:** Banco (settings UI) > env var > default. O sistema faz fallback automatico para `MockAIProvider` se nenhuma API key estiver definida.

### Arquitetura multi-provider

A interface `AIProvider` define o contrato. Cada provider implementa `generateSummary()` como `AsyncGenerator`. O streaming suporta chunks de conteúdo e eventos de erro (`AIStreamChunk` com tipo `"error"`):

```
Settings (getAISettings) → resolve config do DB ou env vars
Factory (getAIProvider)  → recebe settings, seleciona provider
                         → OpenAIProvider | AnthropicProvider | GeminiProvider | MockAIProvider
Errors (errors.ts)       → AIProviderError + extractErrorMessage (tratamento unificado)
Stream Utils             → chunkText, delay, simulateStream (utilitários compartilhados)

GET  /api/ai/providers   → retorna lista de providers disponiveis + default
POST /api/ai/summarize   → aceita parametro "provider" para override do default
GET  /api/settings       → retorna config com API keys mascaradas
PUT  /api/settings       → atualiza config (upsert no banco)
```

---

## Uso de IA no Desenvolvimento

### Ferramentas utilizadas

- **Claude (Anthropic):** Geração da especificação técnica (PRD, ARCHITECTURE, MVP-SCOPE), definição de schemas, estrutura de pastas e padrões de código.

### Onde ajudou

- Definição de escopo e priorização de diferenciais
- Estruturação da arquitetura (AIProvider pattern, caching, auditoria)
- Schemas Zod e interfaces TypeScript
- Geração de boilerplate (NextAuth config, Prisma schema, middleware)
- Documentação (este README, decisões técnicas)

### Revisão manual e tradeoffs

- Todo código gerado por IA foi revisado e adaptado ao contexto do projeto
- Decisões de arquitetura foram validadas contra os requisitos do teste
- Nomes, estrutura de pastas e convenções foram ajustados para consistência
- Testes foram escritos/revisados para garantir que testam o comportamento real, não apenas o formato

### Tradeoffs

- IA acelera boilerplate mas pode gerar padrões genéricos — cada trecho foi avaliado
- Schemas e types foram a parte que mais se beneficiou de IA (repetitivo, propenso a erros)
- Lógica de negócio (auditoria, streaming, caching) foi onde mais houve intervenção manual

---

## Variaveis de Ambiente

> **Nota:** API keys, modelos e provider padrao tambem podem ser configurados via UI em `/settings`. As configuracoes do banco tem prioridade sobre env vars.

```bash
# Supabase / Postgres
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_SECRET="gere-uma-string-aleatoria-aqui"
NEXTAUTH_URL="http://localhost:3000"

# IA — Provider padrao (opcional — sem isso, usa MockAIProvider)
# Valores validos: "mock" | "openai" | "anthropic" | "gemini"
# Pode ser configurado via UI em /settings (prioridade: DB > env var > default)
AI_PROVIDER="mock"

# API Keys dos providers (opcional — tambem configuravel via UI em /settings)
# OPENAI_API_KEY="sk-..."
# OPENAI_MODEL="gpt-4o-mini"
# ANTHROPIC_API_KEY="sk-ant-..."
# ANTHROPIC_MODEL="claude-haiku-4-5-20251001"
# GEMINI_API_KEY="..."
# GEMINI_MODEL="gemini-2.0-flash"

# Cache de IA (tambem configuravel via UI)
AI_CACHE_TTL_MS="3600000"  # 1 hora em ms
```

---

## Scripts Disponíveis

| Comando                  | Descrição                                |
| ------------------------ | ---------------------------------------- |
| `npm run dev`            | Inicia servidor de desenvolvimento       |
| `npm run build`          | Build de produção                        |
| `npm start`              | Inicia servidor de produção              |
| `npm test`               | Roda testes com Vitest                   |
| `npm run test:coverage`  | Testes com relatório de coverage         |
| `npm run lint`           | Roda ESLint                              |
| `npx prisma migrate dev` | Roda migrations                          |
| `npx prisma db seed`     | Popula banco com dados de exemplo        |
| `npx prisma studio`      | Abre UI do Prisma para inspecionar banco |
