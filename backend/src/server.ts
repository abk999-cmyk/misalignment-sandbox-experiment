import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { getConfig } from './config.js';
import { logger } from './lib/logger.js';
import { chatRoutes } from './routes/chat.js';

const config = getConfig();

export async function buildServer() {
  const fastify = Fastify({
    logger: false, // We use our own Pino logger
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId',
    disableRequestLogging: false,
    bodyLimit: config.MAX_REQUEST_SIZE_BYTES,
  });

  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  // CORS - only allow localhost:5173
  await fastify.register(cors, {
    origin: (origin, callback) => {
      if (!origin || origin === 'http://localhost:5173' || origin.startsWith('http://127.0.0.1:5173')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW_MS,
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
  });

  // Health check endpoint
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'xi-wei-backend',
      version: '1.0.0',
      model: config.OPENAI_MODEL,
      limits: {
        rateLimitMax: config.RATE_LIMIT_MAX,
        rateLimitWindowMs: config.RATE_LIMIT_WINDOW_MS,
        maxRequestSizeBytes: config.MAX_REQUEST_SIZE_BYTES,
      },
    };
  });

  // Register chat routes
  await fastify.register(chatRoutes);

  // Error handler
  fastify.setErrorHandler((error, _request, reply) => {
    const requestId = _request.headers['x-request-id'] as string | undefined;
    logger.error(
      {
        requestId,
        error: error.message,
        stack: error.stack,
      },
      'Unhandled error'
    );

    reply.status(error.statusCode || 500).send({
      error: error.message || 'Internal server error',
      requestId,
    });
  });

  return fastify;
}

async function start() {
  try {
    const server = await buildServer();

    // Bind to 127.0.0.1 only (localhost)
    await server.listen({
      port: config.PORT,
      host: config.HOST,
    });

    logger.info(
      {
        port: config.PORT,
        host: config.HOST,
        model: config.OPENAI_MODEL,
      },
      'Server started'
    );
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to start server'
    );
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

start();

