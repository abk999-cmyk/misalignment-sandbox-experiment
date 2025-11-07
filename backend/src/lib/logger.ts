import pino from 'pino';
import { join } from 'path';
import { createWriteStream, mkdirSync } from 'fs';
import { getConfig } from '../config.js';

const config = getConfig();
const isDev = config.NODE_ENV === 'development';

// Create log directory if it doesn't exist
const logDir = join(process.cwd(), 'logs');
try {
  mkdirSync(logDir, { recursive: true });
} catch (error) {
  // Directory might already exist, ignore
}
const logFile = join(logDir, `backend-${new Date().toISOString().split('T')[0]}.ndjson`);

// File stream for structured logs
const fileStream = createWriteStream(logFile, { flags: 'a' });

// Create logger
const logger = pino(
  {
    level: isDev ? 'debug' : 'info',
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    ...(isDev
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss.l',
              ignore: 'pid,hostname',
            },
          },
        }
      : {}),
  },
  isDev ? undefined : fileStream
);

export { logger };
