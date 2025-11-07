import { ModelAdapter, ModelMessage, ModelCompletionResult, ModelCompletionOptions } from "./types";
import { logger } from "../logger";

const BACKEND_URL = "http://localhost:3001";

interface BackendHealth {
  status: string;
  model: string;
  timestamp: string;
}

export class HTTPAdapter implements ModelAdapter {
  name = "HTTP Adapter (gpt-4o)";
  private abortController: AbortController | null = null;
  private isHealthy: boolean = false;
  private healthCheckPromise: Promise<void> | null = null;

  async initialize(_config?: Record<string, unknown>): Promise<void> {
    await this.checkHealth();
    logger.log("model", "info", "HTTP adapter initialized", {
      backendUrl: BACKEND_URL,
      healthy: this.isHealthy,
    });
  }

  private async checkHealth(): Promise<void> {
    if (this.healthCheckPromise) {
      return this.healthCheckPromise;
    }

    this.healthCheckPromise = (async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/health`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const health: BackendHealth = await response.json();
          this.isHealthy = true;
          logger.log("model", "info", "Backend health check passed", {
            model: health.model,
            status: health.status,
          });
        } else {
          this.isHealthy = false;
          logger.log("model", "warn", "Backend health check failed", {
            status: response.status,
          });
        }
      } catch (error) {
        this.isHealthy = false;
        logger.log("model", "error", "Backend health check error", {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        this.healthCheckPromise = null;
      }
    })();

    return this.healthCheckPromise;
  }

  async complete(
    messages: ModelMessage[],
    opts?: ModelCompletionOptions
  ): Promise<ModelCompletionResult> {
    // Check health first
    await this.checkHealth();
    if (!this.isHealthy) {
      throw new Error("Backend is not available. Please ensure the backend server is running on localhost:3001");
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
        body: JSON.stringify({
          messages,
          temperature: opts?.temperature,
          maxTokens: opts?.maxTokens,
          tools: opts?.tools,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Backend error: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      
      logger.log("model", "info", "HTTP adapter completion successful", {
        messageCount: messages.length,
        hasCot: !!result.cot,
      });

      return {
        text: result.text || "",
        cot: result.cot,
        toolCalls: result.toolCalls,
      };
    } catch (error) {
      logger.log("model", "error", "HTTP adapter completion failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async *streamComplete(
    messages: ModelMessage[],
    _opts?: ModelCompletionOptions,
    signal?: AbortSignal
  ): AsyncGenerator<string, void, unknown> {
    // Check health first
    await this.checkHealth();
    if (!this.isHealthy) {
      throw new Error("Backend is not available. Please ensure the backend server is running on localhost:3001");
    }

    // Create abort controller if signal provided
    this.abortController = new AbortController();
    if (signal) {
      signal.addEventListener("abort", () => {
        this.abortController?.abort();
      });
    }

    try {
      const messagesParam = encodeURIComponent(JSON.stringify(messages));
      const url = `${BACKEND_URL}/api/chat/stream?messages=${messagesParam}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-Request-ID": `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("No response body for streaming");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data.trim() === "") continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.done) {
                  return;
                }
                if (parsed.text) {
                  yield parsed.text;
                }
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (parseError) {
                // Skip invalid JSON lines
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        logger.log("model", "info", "HTTP adapter stream aborted");
        return;
      }
      logger.log("model", "error", "HTTP adapter stream failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  getHealthStatus(): boolean {
    return this.isHealthy;
  }

  async refreshHealth(): Promise<void> {
    await this.checkHealth();
  }
}

