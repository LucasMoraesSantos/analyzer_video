# Analyzer Video

Bootstrap inicial do monorepo para a plataforma de análise de vídeos curtos por nicho.

## Estrutura

- `apps/web`: Frontend Next.js (App Router + TypeScript + Tailwind)
- `apps/api`: Backend NestJS (TypeScript + Swagger)
- `packages/types`: Tipos compartilhados
- `packages/config`: Validação central de variáveis de ambiente com Zod

## Infra local

```bash
docker compose up -d
```

## Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste os valores.
