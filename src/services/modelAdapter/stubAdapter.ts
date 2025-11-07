import { ModelAdapter, ModelMessage, ModelCompletionResult, ModelCompletionOptions } from "./types";
import { logger } from "../logger";

export class StubAdapter implements ModelAdapter {
  name = "Stub Adapter";

  async initialize(_config?: Record<string, unknown>): Promise<void> {
    logger.log("model", "info", "Stub adapter initialized");
  }

  async complete(
    messages: ModelMessage[],
    _opts?: ModelCompletionOptions
  ): Promise<ModelCompletionResult> {
    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 500));

    const lastMessage = messages[messages.length - 1];
    const response = `[STUB] I understand your request: "${lastMessage.content.substring(0, 50)}...". This is a stub response.`;

    const cot = `[STUB CoT] Analyzing request: ${lastMessage.content}\nConsidering context from ${messages.length} previous messages.\nGenerating response...`;

    logger.log("model", "info", "Stub adapter generated response", {
      messageCount: messages.length,
    });

    return {
      text: response,
      cot,
    };
  }
}

