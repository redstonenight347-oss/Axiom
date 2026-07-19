import { genAI } from "./config";
import { GEMINI_MODELS, MAX_MODEL_FALLBACK_CYCLES } from "./constants";

export interface ModelRouterOptions {
  label: string;
  preferredModel?: string | null;
}

export interface ModelCallResult<T> {
  modelName: string;
  result: T;
  /** Total tokens consumed across prompt and candidates, if reported by the SDK. */
  tokensUsed?: number;
}

function extractTokenCount(result: unknown): number | undefined {
  if (!result || typeof result !== "object") return undefined;

  const usage = (result as { usageMetadata?: unknown }).usageMetadata;
  if (!usage || typeof usage !== "object") return undefined;

  const candidates = (usage as { candidatesTokenCount?: number }).candidatesTokenCount;
  const prompt = (usage as { promptTokenCount?: number }).promptTokenCount;
  const total = (usage as { totalTokenCount?: number }).totalTokenCount;

  if (typeof total === "number" && total > 0) return total;
  if (typeof candidates === "number" && typeof prompt === "number") {
    return candidates + prompt;
  }
  if (typeof candidates === "number") return candidates;
  if (typeof prompt === "number") return prompt;
  return undefined;
}

function isAsyncIterable<T>(value: unknown): value is AsyncIterable<T> {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as AsyncIterable<T>)[Symbol.asyncIterator] === "function"
  );
}

function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const status = (error as { status?: number; statusCode?: number }).status ?? (error as { statusCode?: number }).statusCode;
  const message = (error as { message?: string }).message ?? "";
  return (
    status === 429 ||
    message.includes("Quota exceeded") ||
    message.includes("quota") ||
    message.includes("Rate limit") ||
    message.includes("rate limit") ||
    message.includes("Resource exhausted")
  );
}

/**
 * Wraps an SDK streaming result so we can observe the final usageMetadata once
 * the stream completes. Returns both the wrapped async iterable and a getter
 * for the token count.
 */
function wrapStreamWithTokenCapture<T extends { usageMetadata?: unknown }>(
  source: AsyncIterable<T>
): { stream: AsyncIterable<T>; getTokensUsed: () => number | undefined } {
  let tokensUsed: number | undefined;

  const stream: AsyncIterable<T> = {
    [Symbol.asyncIterator](): AsyncIterator<T> {
      const iterator = source[Symbol.asyncIterator]();
      return {
        async next() {
          const next = await iterator.next();
          if (next.done && next.value) {
            tokensUsed = extractTokenCount(next.value) ?? tokensUsed;
          }
          return next;
        },
        async return() {
          return iterator.return?.() ?? { done: true, value: undefined };
        },
      };
    },
  };

  return { stream, getTokensUsed: () => tokensUsed };
}

/**
 * Executes an async Gemini operation, cycling through fallback models if a
 * rate-limit / quota error is encountered. Stops after MAX_MODEL_FALLBACK_CYCLES
 * total attempts to avoid infinite loops.
 */
export function resolveModelOrder(preferredModel?: string | null): string[] {
  if (!preferredModel || !GEMINI_MODELS.includes(preferredModel)) {
    return [...GEMINI_MODELS];
  }
  const rest = GEMINI_MODELS.filter((m) => m !== preferredModel);
  return [preferredModel, ...rest];
}

export async function withModelFallback<T>(
  operation: (modelName: string) => Promise<T>,
  options: ModelRouterOptions
): Promise<T> {
  const modelOrder = resolveModelOrder(options.preferredModel);
  const maxAttempts = Math.min(MAX_MODEL_FALLBACK_CYCLES, modelOrder.length);
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const modelName = modelOrder[attempt];
    try {
      console.log(`[ModelRouter] ${options.label} attempt ${attempt + 1}/${maxAttempts} using ${modelName}`);
      const result = await operation(modelName);
      if (attempt > 0) {
        console.log(`[ModelRouter] ${options.label} succeeded on fallback model ${modelName}`);
      }
      return result;
    } catch (error: unknown) {
      lastError = error;
      const isRateLimit = isRateLimitError(error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        `[ModelRouter] ${options.label} failed on ${modelName}: ${errorMessage} (rateLimit=${isRateLimit})`
      );

      if (!isRateLimit || attempt >= maxAttempts - 1) {
        throw error;
      }

      console.log(`[ModelRouter] Falling back to next model...`);
    }
  }

  throw lastError;
}

/**
 * Executes a streaming Gemini operation and reports which model succeeded plus
 * how many tokens were consumed. The callback should return the raw SDK stream;
 * this wrapper handles fallback and metadata extraction.
 */
export async function withStreamingModelFallback<T extends { usageMetadata?: unknown }>(
  operation: (modelName: string) => Promise<AsyncIterable<T>>,
  options: ModelRouterOptions
): Promise<ModelCallResult<AsyncIterable<T>>> {
  const modelOrder = resolveModelOrder(options.preferredModel);
  const maxAttempts = Math.min(MAX_MODEL_FALLBACK_CYCLES, modelOrder.length);
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const modelName = modelOrder[attempt];
    try {
      console.log(`[ModelRouter] ${options.label} attempt ${attempt + 1}/${maxAttempts} using ${modelName}`);
      const rawStream = await operation(modelName);
      if (!isAsyncIterable(rawStream)) {
        throw new Error("Operation did not return an async iterable");
      }

      if (attempt > 0) {
        console.log(`[ModelRouter] ${options.label} succeeded on fallback model ${modelName}`);
      }

      const { stream, getTokensUsed } = wrapStreamWithTokenCapture(rawStream);

      const wrappedStream: AsyncIterable<T> = {
        [Symbol.asyncIterator](): AsyncIterator<T> {
          const iterator = stream[Symbol.asyncIterator]();
          return {
            async next() {
              const next = await iterator.next();
              if (next.done) {
                const tokens = getTokensUsed();
                if (tokens !== undefined) {
                  (wrappedStream as unknown as { tokensUsed?: number }).tokensUsed = tokens;
                }
              }
              return next;
            },
            async return() {
              return iterator.return?.() ?? { done: true, value: undefined };
            },
          };
        },
      };

      return { modelName, result: wrappedStream };
    } catch (error: unknown) {
      lastError = error;
      const isRateLimit = isRateLimitError(error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        `[ModelRouter] ${options.label} failed on ${modelName}: ${errorMessage} (rateLimit=${isRateLimit})`
      );

      if (!isRateLimit || attempt >= maxAttempts - 1) {
        throw error;
      }

      console.log(`[ModelRouter] Falling back to next model...`);
    }
  }

  throw lastError;
}

/**
 * Convenience helper: create a chat session using the first available model.
 * The actual model used will be selected by withModelFallback at call time.
 */
export function createChat(modelName: string) {
  return genAI.chats.create({ model: modelName });
}
