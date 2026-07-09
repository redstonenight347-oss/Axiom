import { genAI, GEMINI_MODELS, MAX_MODEL_FALLBACK_CYCLES } from "./config";

export interface ModelRouterOptions {
  label: string;
}

function isRateLimitError(error: any): boolean {
  if (!error) return false;
  const status = error.status ?? error.statusCode;
  const message = error.message ?? "";
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
 * Executes an async Gemini operation, cycling through fallback models if a
 * rate-limit / quota error is encountered. Stops after MAX_MODEL_FALLBACK_CYCLES
 * total attempts to avoid infinite loops.
 */
export async function withModelFallback<T>(
  operation: (modelName: string) => Promise<T>,
  options: ModelRouterOptions
): Promise<T> {
  const maxAttempts = Math.min(MAX_MODEL_FALLBACK_CYCLES, GEMINI_MODELS.length);
  let lastError: any;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const modelName = GEMINI_MODELS[attempt];
    try {
      console.log(`[ModelRouter] ${options.label} attempt ${attempt + 1}/${maxAttempts} using ${modelName}`);
      const result = await operation(modelName);
      if (attempt > 0) {
        console.log(`[ModelRouter] ${options.label} succeeded on fallback model ${modelName}`);
      }
      return result;
    } catch (error: any) {
      lastError = error;
      const isRateLimit = isRateLimitError(error);
      console.error(
        `[ModelRouter] ${options.label} failed on ${modelName}: ${error.message ?? error} (rateLimit=${isRateLimit})`
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
