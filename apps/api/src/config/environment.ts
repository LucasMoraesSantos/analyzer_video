import { z } from 'zod';

const positiveInt = z.coerce.number().int().positive();

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: positiveInt.default(3001),
  API_PREFIX: z.string().trim().min(1).default('api'),
  DATABASE_URL: z.string().trim().url('DATABASE_URL deve ser uma URL válida.'),
  REDIS_HOST: z.string().trim().min(1),
  REDIS_PORT: positiveInt.default(6379),
  YOUTUBE_API_KEY: z
    .string()
    .trim()
    .min(10, 'YOUTUBE_API_KEY inválida.')
    .refine((value) => value !== 'replace_me', 'YOUTUBE_API_KEY deve ser configurada.'),
  YOUTUBE_API_BASE_URL: z.string().trim().url().default('https://www.googleapis.com/youtube/v3'),
  YOUTUBE_MAX_RETRIES: z.coerce.number().int().min(1).max(8).default(3),
  YOUTUBE_TIMEOUT_MS: z.coerce.number().int().min(1000).max(30000).default(8000),
  OPENAI_API_KEY: z
    .string()
    .trim()
    .min(10, 'OPENAI_API_KEY inválida.')
    .refine((value) => value !== 'replace_me', 'OPENAI_API_KEY deve ser configurada.'),
  OPENAI_MODEL: z.string().trim().min(1).default('gpt-4o-mini'),
  OPENAI_API_BASE_URL: z.string().trim().url().default('https://api.openai.com/v1'),
  OPENAI_MAX_RETRIES: z.coerce.number().int().min(1).max(8).default(3),
  OPENAI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(15000),
  QUEUE_JOB_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(3),
  QUEUE_JOB_BACKOFF_MS: z.coerce.number().int().min(500).max(30000).default(1000)
});

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(config: Record<string, unknown>): Environment {
  const result = environmentSchema.safeParse(config);

  if (!result.success) {
    throw new Error(`Invalid environment configuration: ${result.error.message}`);
  }

  return result.data;
}
