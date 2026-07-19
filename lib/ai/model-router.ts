import { genAI } from "./config";
import { GEMINI_MODELS, MAX_MODEL_FALLBACK_CYCLES } from "./constants";

export interface ModelRouterOptions {
  label: string;
  preferredModel?: string | null;
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
 * Convenience helper: create a chat session using the first available model.
 * The actual model used will be selected by withModelFallback at call time.
 */
export function createChat(modelName: string) {
  return genAI.chats.create({ model: modelName });
}
