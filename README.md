# Ops Copilot

Sistema de registro de tarefas e incidentes com geração automática de resumos, próximos passos e análise de risco por IA. Criado como teste técnico Full-Stack TypeScript.

- **Produção:** https://opscopilot.vercel.app/
- **Repositório:** https://github.com/PabloFBDev/Adapt-Technical-test

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
| Framework | Next.js 16 (App Router)   | Exigido. RSC, layouts, route handlers integrados.                 |
| ORM       | Prisma                    | Type-safety, migrations versionadas, boa integração com Postgres. |
| Banco     | Supabase (Postgres)       | Hosted, sem Docker, connection string simples.                    |
| Auth      | NextAuth (Credentials)    | JWT strategy, registro público, middleware de proteção.           |
| UI        | Tailwind + shadcn/ui      | Componentes acessíveis, estilo clean.                             |
| Validação | Zod                       | Schemas compartilhados front/back, type inference.                |
| Testes    | Vitest                    | ESM nativo, rápido, integração natural com TypeScript.            |
| IA        | Multi-provider (plugável) | OpenAI, Anthropic, Gemini + Mock. Seleção via UI ou env var.      |

Para tradeoffs detalhados, ver [Decisões Técnicas](docs/DECISOES-TECNICAS.md).

---

## Diferenciais Implementados

O teste pedia 2+. Implementei 5:

1. **Edição e mudança de status** — PATCH com partial update, dropdown inline de status
2. **Auditoria de mudanças** — diffs por campo, timeline visual por tipo de ação
3. **Rate limiting** — sliding window in-memory por IP, 4 tiers, `429` com `Retry-After`
4. **Streaming SSE com Multi-Provider** — 4 providers, seletor na UI, erros via stream
5. **Painel de Configuração de IA** — API keys, modelos, cache TTL gerenciados via UI sem redeploy

Detalhes em [Decisões Técnicas](docs/DECISOES-TECNICAS.md#7-diferenciais) e [Escopo MVP](docs/MVP-SCOPE.md).

---

## IA

O sistema suporta **4 providers**, selecionáveis via dropdown na página de detalhe do ticket:

| Provider  | Modelo padrão               | API Key necessária  |
| --------- | --------------------------- | ------------------- |
| Mock      | — (determinístico)          | Nenhuma             |
| OpenAI    | `gpt-4o-mini`               | `OPENAI_API_KEY`    |
| Anthropic | `claude-haiku-4-5-20251001` | `ANTHROPIC_API_KEY` |
| Gemini    | `gemini-2.0-flash`          | `GEMINI_API_KEY`    |

**Sem API key configurada**, o sistema usa `MockAIProvider` automaticamente — retorna dados determinísticos baseados em keywords do ticket, simulando streaming com delay.

**API keys podem ser configuradas de duas formas:**

1. **Via UI (recomendado):** Acesse `/settings` — salva no banco, persiste entre deploys
2. **Via `.env` (fallback):** Adicione as keys no arquivo de ambiente

Prioridade de resolução: **DB > env var > default**.

Para detalhes da arquitetura multi-provider, ver [Arquitetura](docs/ARCHITECTURE.md#padrão-aiprovider).

---

## Documentação

| Documento                                             | Conteúdo                                                                                                         |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [Decisões Técnicas](docs/DECISOES-TECNICAS.md)        | Tradeoffs de cada escolha técnica: stack, arquitetura, IA, segurança, diferenciais e auditoria pós-implementação |
| [Arquitetura](docs/ARCHITECTURE.md)                   | Design do sistema, modelagem de dados, fluxos de autenticação e streaming SSE                                    |
| [PRD](docs/PRD.md)                                    | Requisitos do produto, schemas, user stories, edge cases e critérios de aceitação                                |
| [Escopo MVP](docs/MVP-SCOPE.md)                       | O que entrou (must have), diferenciais escolhidos (should have) e o que ficou de fora (won't have)               |
| [Plano de Implementação](docs/IMPLEMENTATION-PLAN.md) | Ordem de execução em 11 fases, do scaffolding ao polimento final                                                 |

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

> **Nota:** O seed já inclui incidentes de exemplo pré-carregados para facilitar a visualização do sistema. Você também pode criar e editar novos incidentes normalmente.

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

Prisma é mockado via `vi.mock` — testes não tocam banco real e são rápidos e isolados.

---

## Uso de IA no Desenvolvimento

O Claude Code (CLI da Anthropic) foi usado como ferramenta de apoio durante todo o projeto, desde o Product Discovery até a implementação. Todo código gerado foi revisado e adaptado manualmente quando necessário. Detalhes completos sobre onde ajudou, revisão manual e tradeoffs estão em [`docs/DECISOES-TECNICAS.md` - seção 9](docs/DECISOES-TECNICAS.md#9-ferramentas-de-desenvolvimento).

---

## Variáveis de Ambiente

> **Nota:** API keys, modelos e provider padrão também podem ser configurados via UI em `/settings`. As configurações do banco têm prioridade sobre env vars.

```bash
# Supabase / Postgres
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_SECRET="gere-uma-string-aleatoria-aqui"
NEXTAUTH_URL="http://localhost:3000"

# IA — Provider padrão (opcional — sem isso, usa MockAIProvider)
# Valores válidos: "mock" | "openai" | "anthropic" | "gemini"
AI_PROVIDER="mock"

# API Keys dos providers (opcional — também configurável via UI em /settings)
# OPENAI_API_KEY="sk-..."
# OPENAI_MODEL="gpt-4o-mini"
# ANTHROPIC_API_KEY="sk-ant-..."
# ANTHROPIC_MODEL="claude-haiku-4-5-20251001"
# GEMINI_API_KEY="..."
# GEMINI_MODEL="gemini-2.0-flash"

# Cache de IA (também configurável via UI)
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
