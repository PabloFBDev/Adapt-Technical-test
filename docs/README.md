# Ops Copilot

Sistema de registro de tarefas e incidentes com geração automática de resumos, próximos passos e análise de risco por IA. Criado como teste técnico Full-Stack TypeScript.

---

## Visão do Produto

Ops Copilot permite que equipes de operações registrem tickets de incidentes e tarefas, acompanhem seu status e obtenham análises automáticas via IA. O sistema oferece busca, filtros por status/prioridade/tags, edição com auditoria de mudanças e geração de resumos com streaming em tempo real.

---

## Arquitetura

```
┌─────────────────────────────────────────────┐
│            Frontend (Next.js App Router)     │
│  Pages • Components • Middleware (Auth)      │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Backend (Next.js Route Handlers)     │
│  /api/tickets • /api/ai/summarize • NextAuth │
└──────┬────────────────┬─────────────────────┘
       │                │
┌──────▼──────┐  ┌──────▼──────────────┐
│  Prisma ORM │  │  AI Provider Layer   │
│             │  │  Factory → Mock/Real │
└──────┬──────┘  │  + Cache (Postgres)  │
       │         └─────────────────────┘
┌──────▼──────┐
│  Supabase   │
│  (Postgres) │
└─────────────┘
```

---

## Decisões Técnicas

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Framework | Next.js 14+ (App Router) | Exigido. RSC, layouts, route handlers integrados. |
| ORM | Prisma | Type-safety, migrations versionadas, boa integração com Postgres. |
| Banco | Supabase (Postgres) | Hosted, sem Docker, connection string simples. |
| Auth | NextAuth (Credentials) | JWT strategy, session handling, middleware de proteção. |
| UI | Tailwind + shadcn/ui | Componentes acessíveis, estilo clean. |
| Validação | Zod | Schemas compartilhados front/back, type inference. |
| Testes | Vitest | ESM nativo, rápido, integração natural com TypeScript. |
| IA | MockAIProvider (plugável) | Interface abstrata; mock funciona sem API key. |
| Streaming | SSE (Server-Sent Events) | Nativo do browser, sem websocket, boa DX. |

---

## Como Rodar Local

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no [Supabase](https://supabase.com) (free tier funciona)

### Setup

```bash
# 1. Clonar o repositório
git clone https://github.com/SEU_USUARIO/ops-copilot.git
cd ops-copilot

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do Supabase (ver seção abaixo)

# 4. Rodar migrations do Prisma
npx prisma migrate dev

# 5. Rodar seed (cria usuário padrão + tickets de exemplo)
npx prisma db seed

# 6. Iniciar o servidor de desenvolvimento
npm run dev
```

O app estará disponível em `http://localhost:3000`.

### Login

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

### O que é testado

- **AIProvider:** MockAIProvider retorna AIResult válido, streaming emite chunks corretos, factory resolve provider
- **Schemas Zod:** Validação de criação/edição de ticket, query params, input do summarize
- **Route Handlers:** Contratos da API (status codes, formato de resposta, validação de input)

---

## Como Usar IA / Fallback

### Comportamento padrão (sem API key)

O sistema usa `MockAIProvider` automaticamente. O mock:

- Retorna dados determinísticos baseados em keywords do ticket
- Simula streaming com delay de 50–100ms por chunk
- Classifica risco como `high` se o título contém "bug" ou "error"
- Classifica como `low` se contém "feature" ou "request"
- Funciona sem configuração adicional

### Usando um provider real (futuro)

Para usar um provider real, basta:

1. Implementar a interface `AIProvider`:
```typescript
export class OpenAIProvider implements AIProvider {
  async *generateSummary(input) {
    // Chamar OpenAI API e emitir chunks
  }
}
```

2. Registrar no factory (`src/lib/ai/factory.ts`)

3. Configurar no `.env`:
```
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

O sistema faz fallback automático para `MockAIProvider` se o provider configurado falhar ou se a API key não estiver definida.

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

## Variáveis de Ambiente

```bash
# .env.example

# Supabase / Postgres
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_SECRET="gere-uma-string-aleatoria-aqui"
NEXTAUTH_URL="http://localhost:3000"

# IA (opcional — sem isso, usa MockAIProvider)
AI_PROVIDER="mock"
# OPENAI_API_KEY="sk-..."
# ANTHROPIC_API_KEY="sk-ant-..."

# Cache de IA
AI_CACHE_TTL_MS="3600000"  # 1 hora em ms
```

---

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Inicia servidor de produção |
| `npm test` | Roda testes com Vitest |
| `npm run test:coverage` | Testes com relatório de coverage |
| `npm run lint` | Roda ESLint |
| `npx prisma migrate dev` | Roda migrations |
| `npx prisma db seed` | Popula banco com dados de exemplo |
| `npx prisma studio` | Abre UI do Prisma para inspecionar banco |
