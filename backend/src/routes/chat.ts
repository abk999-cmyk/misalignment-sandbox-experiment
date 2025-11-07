import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ChatRequestSchema, ChatResponseSchema } from '../lib/validators.js';
import { completeChat, streamChat } from '../lib/openai.js';
import { logger } from '../lib/logger.js';

export async function chatRoutes(fastify: FastifyInstance) {
  // Non-streaming chat endpoint
  fastify.post<{ Body: unknown }>('/api/chat', async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = request.headers['x-request-id'] as string | undefined;
    const correlationId = requestId || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Validate request
      const validated = ChatRequestSchema.parse(request.body);

      logger.info(
        {
          correlationId,
          messageCount: validated.messages.length,
          hasTools: !!validated.tools?.length,
        },
        'Chat request received'
      );

      // Complete chat
      const result = await completeChat(validated.messages, {
        temperature: validated.temperature,
        maxTokens: validated.maxTokens,
      });

      // Validate response
      const response = ChatResponseSchema.parse(result);

      reply.header('X-Request-ID', correlationId);
      reply.send(response);
    } catch (error) {
      logger.error(
        {
          correlationId,
          error: error instanceof Error ? error.message : String(error),
        },
        'Chat request failed'
      );

      if (error instanceof Error && error.name === 'ZodError') {
        reply.code(400).send({
          error: 'Invalid request',
          details: error.message,
        });
        return;
      }

      reply.code(500).send({
        error: 'Internal server error',
        correlationId,
      });
    }
  });

  // Streaming chat endpoint (SSE)
  fastify.get<{ Querystring: { messages?: string } }>(
    '/api/chat/stream',
    async (request: FastifyRequest<{ Querystring: { messages?: string } }>, reply: FastifyReply) => {
      const requestId = request.headers['x-request-id'] as string | undefined;
      const correlationId = requestId || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      try {
        // Parse messages from query string (JSON encoded)
        const messagesParam = request.query.messages;
        if (!messagesParam) {
          reply.code(400).send({ error: 'Missing messages parameter' });
          return;
        }

        const messages = JSON.parse(decodeURIComponent(messagesParam));
        const validated = ChatRequestSchema.parse({ messages, stream: true });

        logger.info(
          {
            correlationId,
            messageCount: validated.messages.length,
          },
          'Stream chat request received'
        );

        // Set SSE headers
        reply.raw.setHeader('Content-Type', 'text/event-stream');
        reply.raw.setHeader('Cache-Control', 'no-cache');
        reply.raw.setHeader('Connection', 'keep-alive');
        reply.raw.setHeader('X-Request-ID', correlationId);
        reply.raw.writeHead(200);

        // Stream tokens
        try {
          for await (const chunk of streamChat(validated.messages, {
            temperature: validated.temperature,
            maxTokens: validated.maxTokens,
          })) {
            reply.raw.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
          }
          reply.raw.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          reply.raw.end();
        } catch (streamError) {
          logger.error(
            {
              correlationId,
              error: streamError instanceof Error ? streamError.message : String(streamError),
            },
            'Stream error'
          );
          reply.raw.write(`data: ${JSON.stringify({ error: 'Stream error', done: true })}\n\n`);
          reply.raw.end();
        }
      } catch (error) {
        logger.error(
          {
            correlationId,
            error: error instanceof Error ? error.message : String(error),
          },
          'Stream request failed'
        );

        if (error instanceof Error && error.name === 'ZodError') {
          reply.code(400).send({
            error: 'Invalid request',
            details: error.message,
          });
          return;
        }

        reply.code(500).send({
          error: 'Internal server error',
          correlationId,
        });
      }
    }
  );
}

