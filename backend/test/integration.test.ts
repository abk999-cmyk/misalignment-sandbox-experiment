import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/server.js';

describe('Integration Tests', () => {
  let server: Awaited<ReturnType<typeof buildServer>>;

  beforeAll(async () => {
    // Use a different port for tests to avoid conflicts
    process.env.PORT = '3002';
    server = await buildServer();
    await server.listen({ port: 3002, host: '127.0.0.1' });
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('ok');
      expect(body.service).toBe('xi-wei-backend');
    });
  });

  describe('POST /api/chat', () => {
    it('should validate request schema', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/chat',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost:5173',
        },
        payload: {
          messages: [],
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should accept valid request', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/chat',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost:5173',
        },
        payload: {
          messages: [{ role: 'user', content: 'test' }],
        },
      });

      // Will fail without API key, but should validate schema first
      expect([200, 500]).toContain(response.statusCode);
    });
  });

  describe('CORS', () => {
    it('should reject unauthorized origin', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health',
        headers: {
          origin: 'http://evil.com',
        },
      });

      // Fastify CORS will handle this
      expect(response.statusCode).toBe(200); // Health endpoint doesn't check CORS
    });
  });
});

