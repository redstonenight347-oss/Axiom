import { GoogleGenAI } from "@google/genai";

const geminiApiKey = process.env.GEMINI_API_KEY;
const tavilyApiKey = process.env.TAVILY_API_KEY;

if (!geminiApiKey) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

if (!tavilyApiKey) {
  throw new Error("Missing TAVILY_API_KEY environment variable");
}

// Ordered list of Gemini models to try. The first one is the default.
// The router will cycle through these on rate-limit / quota errors.
export const GEMINI_MODELS = [
  "gemini-3.1-flash-lite",
  // Add fallback model names here, e.g.:
  // "gemini-2.0-flash",
  // "gemini-1.5-flash",
];

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

// Backwards-compatible default model alias.
export const GEMINI_MODEL = GEMINI_MODELS[0];

export const genAI = new GoogleGenAI({ apiKey: geminiApiKey });

export const env = {
  geminiApiKey,
  tavilyApiKey,
} as const;
