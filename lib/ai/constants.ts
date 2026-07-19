// Browser-safe constants shared between client and server.
// Do NOT import environment variables or server-only constructors here.

export interface ModelLimit {
  /** Requests Per Minute */
  rpm: number;
  /** Tokens Per Minute */
  tpm: number;
  /** Requests Per Day */
  rpd: number;
}

/** Per-model API limits. Keep this in sync with the model list below. */
export const MODEL_LIMITS: Record<string, ModelLimit> = {
  "gemini-3.1-flash-lite": { rpm: 15, tpm: 250000, rpd: 500 },
  "gemini-2.5-flash-lite": { rpm: 10, tpm: 250000, rpd: 20 },
  "gemini-2.5-flash": { rpm: 5, tpm: 250000, rpd: 20 },
  "gemini-3-flash": { rpm: 5, tpm: 250000, rpd: 20 },
  "gemini-3.5-flash": { rpm: 5, tpm: 250000, rpd: 20 },
};

// Ordered list of Gemini models to try. The first one is the default.
// The router will cycle through these on rate-limit / quota errors.
export const GEMINI_MODELS = Object.keys(MODEL_LIMITS);

// Maximum number of model fallback attempts across the whole list.
// 1 means only the first model is tried; 2 means try up to 2 models, etc.
export const MAX_MODEL_FALLBACK_CYCLES = 2;

// Token-safety / cost-safety limits for the web tooling pipeline.
export const MAX_PLANNER_SEARCHES = 5;
export const MAX_SEARCH_RESULTS_PER_QUERY = 3;
export const MAX_RESULT_CONTENT_CHARS = 1500;
export const MAX_SUMMARY_CHARS = 800;

// If total raw Tavily result characters are below this, skip per-query summarization
// and let the report generator process the raw results directly.
export const MAX_RAW_CHARS_FOR_DIRECT_REPORT = 6000;

// Tavily resilience settings.
export const TAVILY_TIMEOUT_MS = 15000;
export const TAVILY_MAX_RETRIES = 3;
export const TAVILY_RETRY_BASE_DELAY_MS = 500;

// Conversation history settings.
// Number of recent messages to send to the model as context.
// Set to 0 to disable history (only the current user message is sent).
export const MAX_HISTORY_MESSAGES = 10;

// Backwards-compatible default model alias.
export const GEMINI_MODEL = GEMINI_MODELS[0];
