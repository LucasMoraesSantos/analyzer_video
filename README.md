# Analyzer Video Monorepo

Bootstrap inicial (ETAPA 1) da plataforma para análise de vídeos curtos por nicho.

## Estrutura

- `apps/web`: frontend Next.js (App Router + TypeScript + Tailwind)
- `apps/api`: backend NestJS (TypeScript + Swagger)
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

## Objetivo desta etapa

Esta etapa contém apenas a fundação do monorepo e infraestrutura local. Regras de negócio e telas finais serão implementadas nas próximas etapas.
