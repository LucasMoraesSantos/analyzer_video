# Analyzer Video Monorepo

Plataforma para coleta, análise e geração de insumos criativos a partir de vídeos curtos por nicho.

O projeto é organizado em monorepo e possui:
- **API** NestJS (coleta, pipeline assíncrona, analytics, sumários e roteiros)
- **Frontend admin** Next.js (dashboard operacional)
- **Infra local** com PostgreSQL + Redis via Docker

---

## 1) Visão geral

O fluxo principal do MVP é:
1. Cadastrar/gerenciar nichos e keywords.
2. Disparar coleta (manual) por nicho ou para todos os nichos.
3. Pipeline assíncrona processa vídeos:
   - coleta/importação
   - análise de tendência
   - geração de resumo estruturado
   - geração de roteiros derivados (30/45/60)
4. Frontend consome endpoints de leitura para dashboard e páginas de detalhe.

---

## 2) Arquitetura (alto nível)

### Backend (`apps/api`)
- **NestJS modular** por domínio: `niches`, `keywords`, `videos`, `collection`, `analytics`, `summaries`, `scripts`, `dashboard`, `health`.
- **Prisma + PostgreSQL** para persistência.
- **BullMQ + Redis** para processamento assíncrono.
- **Providers externos**:
  - YouTube Data API (coleta de vídeos)
  - OpenAI API (sumários/roteiros)
- **Resiliência**:
  - retries configuráveis em filas e integrações externas
  - fallbacks para indisponibilidade de IA/YouTube
  - logs estruturados e tratamento consistente de falhas

### Frontend (`apps/web`)
- **Next.js App Router** com layout administrativo.
- **TanStack Query** para leitura/mutation com cache e invalidação.
- **Tailwind CSS** para UI.
- Páginas operacionais para dashboard, nichos, vídeos e detalhe de vídeo.

---

## 3) Stack utilizada

- **Node.js 20+** / **npm 10+**
- **TypeScript**
- **NestJS 11**
- **Prisma 6**
- **PostgreSQL 16**
- **Redis 7**
- **BullMQ**
- **Next.js 15** + **React 19**
- **TanStack Query**
- **Recharts**
- **Zod** (validação de ambiente)

---

## 4) Estrutura de pastas

```txt
apps/
  api/                 # Backend NestJS
    prisma/            # schema, migrations, seed
    src/modules/       # domínios e regras
  web/                 # Frontend admin (Next.js)
packages/
  config/              # utilitários de configuração compartilhados
  types/               # tipos compartilhados
  ui/                  # base de componentes compartilháveis
scripts/
  check-structure.mjs  # valida estrutura mínima do monorepo
```

---

## 5) Pré-requisitos

- Node.js `20+`
- npm `10+`
- Docker + Docker Compose

---

## 6) Como rodar localmente

### 6.1 Configurar variáveis de ambiente

```bash
cp .env.example .env
```

### 6.2 Subir infraestrutura (PostgreSQL + Redis)

```bash
docker compose up -d
```

Serviços:
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

### 6.3 Instalar dependências

```bash
npm install
```

### 6.4 Gerar client Prisma

```bash
npm run prisma:generate --workspace @analyzer/api
```

### 6.5 Rodar migrations

Desenvolvimento:

```bash
npm run prisma:migrate:dev --workspace @analyzer/api
```

Deploy/local idempotente:

```bash
npm run prisma:migrate:deploy --workspace @analyzer/api
```

### 6.6 Rodar seed

```bash
npm run prisma:seed --workspace @analyzer/api
```

### 6.7 Iniciar backend e frontend

Em terminais separados:

```bash
npm run dev:api
npm run dev:web
```

Ou em paralelo:

```bash
npm run dev
```

---

## 7) Variáveis de ambiente

Arquivo base: `.env.example`.

Principais grupos:
- Runtime/API: `NODE_ENV`, `API_PORT`, `API_PREFIX`
- Banco: `DATABASE_URL`
- Redis/Fila: `REDIS_HOST`, `REDIS_PORT`, `QUEUE_JOB_ATTEMPTS`, `QUEUE_JOB_BACKOFF_MS`
- YouTube: `YOUTUBE_API_KEY`, `YOUTUBE_API_BASE_URL`, `YOUTUBE_MAX_RETRIES`, `YOUTUBE_TIMEOUT_MS`
- OpenAI: `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_API_BASE_URL`, `OPENAI_MAX_RETRIES`, `OPENAI_TIMEOUT_MS`
- Web: `NEXT_PUBLIC_API_BASE_URL`

> A validação é rígida no bootstrap da API (Zod). Placeholders e valores inválidos quebram inicialização para evitar ambiente inconsistente.

---

## 8) Swagger e endpoints

Com API em execução (`API_PORT=3001`, `API_PREFIX=api`):
- Swagger UI: `http://localhost:3001/docs`
- Base dos endpoints: `http://localhost:3001/api`

Exemplos úteis:
- `GET /api/health`
- `GET /api/dashboard/overview`
- `GET /api/videos`
- `GET /api/videos/:id`
- `GET /api/videos/:id/summary`
- `GET /api/videos/:id/scripts`
- `GET /api/analytics/trends`

---

## 9) Como disparar coleta

### Via API

- Rodar coleta para um nicho:

```bash
curl -X POST http://localhost:3001/api/collection/run/<NICHE_ID>
```

- Rodar coleta para todos os nichos ativos:

```bash
curl -X POST http://localhost:3001/api/collection/run-all
```

- Acompanhar jobs:

```bash
curl http://localhost:3001/api/collection/jobs
curl http://localhost:3001/api/collection/jobs/<JOB_ID>
```

### Via interface

Na página **Nichos** (`/nichos`) existem botões para:
- disparar coleta por nicho
- disparar coleta de todos os nichos
- acompanhar status por nicho/job

---

## 10) Scripts importantes

### Raiz

```bash
npm run check:structure
npm run lint
npm run build
npm run test
```

### API

```bash
npm run dev --workspace @analyzer/api
npm run lint --workspace @analyzer/api
npm run build --workspace @analyzer/api
npm run test --workspace @analyzer/api
```

### Web

```bash
npm run dev --workspace @analyzer/web
npm run lint --workspace @analyzer/web
npm run build --workspace @analyzer/web
npm run test --workspace @analyzer/web
```

---


## 11) Publicar online (Netlify + API)

### 11.1 Deploy do frontend no Netlify

Este repositório já inclui `netlify.toml` para build do workspace web (`@analyzer/web`) com runtime oficial do Next.js (plugin gerenciado pelo Netlify).

1. Crie um novo site no Netlify apontando para este repositório.
2. Mantenha o build command definido no arquivo (`npm install --workspaces --include-workspace-root && npm run build --workspace @analyzer/web`).
3. Configure as variáveis do frontend no Netlify:
   - `NEXT_PUBLIC_API_BASE_URL` = URL pública da sua API (ex: `https://sua-api.onrender.com/api`)
   - `NEXT_PUBLIC_NETLIFY_SITE_URL` = URL do seu próprio site Netlify (ex: `https://analyzer-video.netlify.app`)
4. Faça deploy.

### 11.2 API online

A API NestJS pode ser publicada em qualquer provedor Node.js (Render, Railway, Fly.io, etc.) com PostgreSQL e Redis gerenciados.

Variáveis mínimas para produção:
- `NODE_ENV=production`
- `API_PORT` (normalmente fornecida pela plataforma)
- `API_PREFIX=api`
- `CORS_ORIGIN` com o domínio do Netlify (ex: `https://analyzer-video.netlify.app`)
- `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`
- `YOUTUBE_API_KEY`, `OPENAI_API_KEY`

Depois do deploy da API, atualize `NEXT_PUBLIC_API_BASE_URL` no Netlify para liberar uso completo da aplicação online.

### 11.3 Onde aparece o link no app

Na página **Configurações** (`/configuracoes`), o frontend exibe:
- URL da API atual (`NEXT_PUBLIC_API_BASE_URL`)
- link público da aplicação (`NEXT_PUBLIC_NETLIFY_SITE_URL`)

Assim o time consegue abrir rapidamente a versão online em produção.

---

## 12) Dependências externas principais

- **YouTube Data API v3**
  - usada para busca e detalhamento de vídeos
  - sujeita a quotas/rate limits
- **OpenAI API**
  - usada para geração de resumo estruturado e roteiros
  - sujeita a latência e indisponibilidade transitória

O sistema possui retries e fallbacks para reduzir impacto dessas dependências no pipeline.

---

## 13) Decisões arquiteturais relevantes

1. **Pipeline assíncrona com BullMQ**
   - evita bloquear requests HTTP com tarefas longas.
2. **Persistência orientada a auditoria**
   - snapshots, análises, sumários e roteiros salvos como histórico.
3. **Contratos estáveis para UI**
   - endpoints de dashboard entregam dados preparados.
4. **Resiliência por padrão**
   - retries + fallbacks + logs estruturados para cenários reais.
5. **Validação rígida de ambiente**
   - falha rápida no bootstrap quando env está inconsistente.

---

## 14) Limitações atuais do MVP

- Sem autenticação/autorização.
- Sem CI com quality gate obrigatório (lint/build/test) no repositório.
- Frontend ainda com foco operacional (sem design system completo).
- Cobertura de testes focada no essencial (não exaustiva).
- Dependência de APIs externas (YouTube/OpenAI) para fluxo completo.

---

## 15) Roadmap futuro (sugestão)

- Autenticação e RBAC no admin.
- Dashboards avançados (séries temporais e comparativos por nicho).
- Retries/reprocessamento manual por etapa da pipeline.
- Testes E2E da API e frontend.
- Observabilidade com tracing/métricas centralizadas.
- Deploy automatizado com CI/CD e ambiente de staging.

---

## 16) Onboarding rápido (checklist)

1. `cp .env.example .env`
2. `docker compose up -d`
3. `npm install`
4. `npm run prisma:generate --workspace @analyzer/api`
5. `npm run prisma:migrate:dev --workspace @analyzer/api`
6. `npm run prisma:seed --workspace @analyzer/api`
7. `npm run dev`
8. Abrir `http://localhost:3001/docs` e `http://localhost:3000/dashboard`

