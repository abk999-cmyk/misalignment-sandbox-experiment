import OpenAI from 'openai';
import { getConfig } from '../config.js';
import { logger } from './logger.js';
import { ChatMessage, ChatResponse } from './validators.js';

const config = getConfig();

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
      timeout: config.OPENAI_TIMEOUT_MS,
      maxRetries: 3,
    });
  }
  return openaiClient;
}

export async function completeChat(
  messages: ChatMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  } = {}
): Promise<ChatResponse> {
  const client = getOpenAIClient();
  const startTime = Date.now();

  try {
    const completion = await client.chat.completions.create({
      model: config.OPENAI_MODEL,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: options.temperature ?? config.OPENAI_TEMPERATURE,
      max_tokens: options.maxTokens ?? config.OPENAI_MAX_TOKENS,
      stream: false,
    });

    const latency = Date.now() - startTime;

    // Type guard: ensure it's not a stream
    if ('choices' in completion === false) {
      throw new Error('Unexpected stream response');
    }

    const choice = completion.choices[0];
    if (!choice || !choice.message) {
      throw new Error('No completion choice returned');
    }

    const response: ChatResponse = {
      text: choice.message.content || '',
      cot: choice.message.content?.includes('[CoT]') ? choice.message.content : undefined,
    };

    logger.info(
      {
        model: config.OPENAI_MODEL,
        latency,
        tokens: 'usage' in completion ? completion.usage?.total_tokens : undefined,
        promptTokens: 'usage' in completion ? completion.usage?.prompt_tokens : undefined,
        completionTokens: 'usage' in completion ? completion.usage?.completion_tokens : undefined,
      },
      'Chat completion successful'
    );

    return response;
  } catch (error) {
    const latency = Date.now() - startTime;
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        latency,
      },
      'Chat completion failed'
    );
    throw error;
  }
}

export async function* streamChat(
  messages: ChatMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
  } = {}
): AsyncGenerator<string, void, unknown> {
  const client = getOpenAIClient();
  const startTime = Date.now();

  try {
    const stream = await client.chat.completions.create({
      model: config.OPENAI_MODEL,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: options.temperature ?? config.OPENAI_TEMPERATURE,
      max_tokens: options.maxTokens ?? config.OPENAI_MAX_TOKENS,
      stream: true,
    });

    let fullText = '';
    let tokenCount = 0;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullText += delta;
        tokenCount++;
        yield delta;
      }
    }

    const latency = Date.now() - startTime;
    logger.info(
      {
        model: config.OPENAI_MODEL,
        latency,
        tokens: tokenCount,
      },
      'Stream completion successful'
    );
  } catch (error) {
    const latency = Date.now() - startTime;
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        latency,
      },
      'Stream completion failed'
    );
    throw error;
  }
}

