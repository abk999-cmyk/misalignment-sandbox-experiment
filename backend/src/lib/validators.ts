import { z } from 'zod';

export const ChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1).max(100000),
});

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(100),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(16000).optional(),
  tools: z.array(z.string()).optional(),
  stream: z.boolean().optional().default(false),
});

export const ChatResponseSchema = z.object({
  text: z.string(),
  cot: z.string().optional(),
  toolCalls: z
    .array(
      z.object({
        name: z.string(),
        arguments: z.record(z.unknown()),
      })
    )
    .optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

