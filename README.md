# Analyzer Video Monorepo

Monorepo da plataforma de análise de vídeos curtos por nicho, com pipeline assíncrona de coleta, sumarização e geração de roteiros.

## Estrutura

- `apps/web`: frontend Next.js (App Router + TypeScript + Tailwind)
- `apps/api`: backend NestJS (TypeScript + Swagger + BullMQ)
- `packages/types`: tipos compartilhados
- `packages/config`: utilitários e schema de configuração
- `packages/ui`: base para componentes compartilhados de UI

## Pré-requisitos

- Node.js 20+
- npm 10+
- Docker + Docker Compose

## 1) Configurar ambiente

```bash
cp .env.example .env
```

## 2) Subir infraestrutura local

```bash
docker compose up -d
```

Serviços disponíveis:
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## 3) Instalar dependências

```bash
npm install
```

## 4) Rodar aplicações em desenvolvimento

Em terminais separados:

```bash
npm run dev:api
npm run dev:web
```

Ou em paralelo pelo script raiz:

```bash
npm run dev
```

## Scripts de workspace (raiz)

```bash
npm run check:structure
npm run lint
npm run build
npm run test
```

## Scripts úteis da API

```bash
npm run test --workspace @analyzer/api
npm run test:summary-parser --workspace @analyzer/api
npm run test:script-parser --workspace @analyzer/api
```

## Endpoints principais da API

- `GET /health`
- `GET /niches`
- `GET /keywords`
- `GET /videos`
- `GET /summaries/video/:videoId`
- `GET /scripts/video/:videoId`
- `POST /collection/jobs`
- `GET /collection/jobs`

Para explorar todos os endpoints e schemas, use o Swagger exposto pela API em execução.
