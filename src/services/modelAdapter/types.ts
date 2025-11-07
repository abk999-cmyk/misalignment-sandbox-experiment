export interface ModelMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ModelCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  tools?: string[];
}

export interface ModelCompletionResult {
  text: string;
  cot?: string; // Chain of thought
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, unknown>;
  }>;
}

export interface ModelAdapter {
  name: string;
  initialize(config?: Record<string, unknown>): Promise<void>;
  complete(
    messages: ModelMessage[],
    opts?: ModelCompletionOptions
  ): Promise<ModelCompletionResult>;
}

