import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local first (in backend/), then .env (in backend/), then root .env
dotenvConfig({ path: join(__dirname, '../.env.local') });
dotenvConfig({ path: join(__dirname, '../.env') });
dotenvConfig({ path: join(__dirname, '../../.env.local') });
dotenvConfig({ path: join(__dirname, '../../.env') });

const ConfigSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default('127.0.0.1'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  MAX_REQUEST_SIZE_BYTES: z.coerce.number().int().positive().default(262144),
  OPENAI_MODEL: z.string().default('gpt-4o'),
  OPENAI_MAX_TOKENS: z.coerce.number().int().positive().default(4096),
  OPENAI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.7),
  OPENAI_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),
});

export type Config = z.infer<typeof ConfigSchema>;

let config: Config | null = null;

export function getConfig(): Config {
  if (!config) {
    const result = ConfigSchema.safeParse(process.env);
    if (!result.success) {
      throw new Error(`Configuration error: ${result.error.message}`);
    }
    config = result.data;
  }
  return config;
}
