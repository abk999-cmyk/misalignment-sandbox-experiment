import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HTTPAdapter } from '../httpAdapter';
import { ModelMessage } from '../types';

// Mock fetch globally
global.fetch = vi.fn();

describe('HTTPAdapter', () => {
  let adapter: HTTPAdapter;
  const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    adapter = new HTTPAdapter();
    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('should check backend health on initialization', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'ok',
          model: 'gpt-4o',
        }),
      });

      await adapter.initialize();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/health',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('complete', () => {
    beforeEach(async () => {
      // Mock health check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' }),
      });
      await adapter.initialize();
    });

    it('should send chat request to backend', async () => {
      const messages: ModelMessage[] = [
        { role: 'user', content: 'Hello' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          text: 'Hello! How can I help?',
          cot: undefined,
        }),
      });

      const result = await adapter.complete(messages);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/chat',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            messages,
            stream: false,
          }),
        })
      );

      expect(result.text).toBe('Hello! How can I help?');
    });

    it('should throw error when backend is unavailable', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      });

      await expect(
        adapter.complete([{ role: 'user', content: 'test' }])
      ).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        adapter.complete([{ role: 'user', content: 'test' }])
      ).rejects.toThrow('Network error');
    });
  });

  describe('streamComplete', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' }),
      });
      await adapter.initialize();
    });

    it('should stream tokens from SSE endpoint', async () => {
      const messages: ModelMessage[] = [
        { role: 'user', content: 'Hello' },
      ];

      const mockReader = {
        read: vi.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"text":"Hello"}\n\n'),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"text":"!"}\n\n'),
          })
          .mockResolvedValueOnce({
            done: true,
            value: undefined,
          }),
        releaseLock: vi.fn(),
      };

      const mockBody = {
        getReader: vi.fn().mockReturnValue(mockReader),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockBody,
      });

      const chunks: string[] = [];
      for await (const chunk of adapter.streamComplete(messages)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello', '!']);
    });
  });

  describe('health status', () => {
    it('should return health status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' }),
      });
      
      await adapter.initialize();
      expect(adapter.getHealthStatus()).toBe(true);
    });

    it('should refresh health status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' }),
      });

      await adapter.refreshHealth();
      expect(adapter.getHealthStatus()).toBe(true);
    });
  });
});

