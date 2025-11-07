import { describe, it, expect } from 'vitest';
import { ChatMessageSchema, ChatRequestSchema, ChatResponseSchema } from '../src/lib/validators.js';

describe('Validators', () => {
  describe('ChatMessageSchema', () => {
    it('should validate valid message', () => {
      const valid = { role: 'user', content: 'Hello' };
      expect(() => ChatMessageSchema.parse(valid)).not.toThrow();
    });

    it('should reject invalid role', () => {
      const invalid = { role: 'invalid', content: 'Hello' };
      expect(() => ChatMessageSchema.parse(invalid)).toThrow();
    });

    it('should reject empty content', () => {
      const invalid = { role: 'user', content: '' };
      expect(() => ChatMessageSchema.parse(invalid)).toThrow();
    });

    it('should reject content over 100KB', () => {
      const invalid = { role: 'user', content: 'x'.repeat(100001) };
      expect(() => ChatMessageSchema.parse(invalid)).toThrow();
    });
  });

  describe('ChatRequestSchema', () => {
    it('should validate valid request', () => {
      const valid = {
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 0.7,
        maxTokens: 1000,
      };
      expect(() => ChatRequestSchema.parse(valid)).not.toThrow();
    });

    it('should reject empty messages', () => {
      const invalid = { messages: [] };
      expect(() => ChatRequestSchema.parse(invalid)).toThrow();
    });

    it('should reject too many messages', () => {
      const invalid = {
        messages: Array(101).fill({ role: 'user', content: 'test' }),
      };
      expect(() => ChatRequestSchema.parse(invalid)).toThrow();
    });

    it('should reject invalid temperature', () => {
      const invalid = {
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 3,
      };
      expect(() => ChatRequestSchema.parse(invalid)).toThrow();
    });
  });

  describe('ChatResponseSchema', () => {
    it('should validate valid response', () => {
      const valid = { text: 'Hello response' };
      expect(() => ChatResponseSchema.parse(valid)).not.toThrow();
    });

    it('should validate response with CoT', () => {
      const valid = { text: 'Hello', cot: 'Thinking...' };
      expect(() => ChatResponseSchema.parse(valid)).not.toThrow();
    });
  });
});

