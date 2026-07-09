import { GoogleGenAI } from "@google/genai";

const geminiApiKey = process.env.GEMINI_API_KEY;
const tavilyApiKey = process.env.TAVILY_API_KEY;

if (!geminiApiKey) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

if (!tavilyApiKey) {
  throw new Error("Missing TAVILY_API_KEY environment variable");
}

export const GEMINI_MODEL = "gemini-3.1-flash-lite";

// Token-safety / cost-safety limits for the web tooling pipeline.
export const MAX_PLANNER_SEARCHES = 5;
export const MAX_SEARCH_RESULTS_PER_QUERY = 3;
export const MAX_RESULT_CONTENT_CHARS = 1500;
export const MAX_SUMMARY_CHARS = 800;

// Tavily resilience settings.
export const TAVILY_TIMEOUT_MS = 15000;
export const TAVILY_MAX_RETRIES = 3;
export const TAVILY_RETRY_BASE_DELAY_MS = 500;

export const genAI = new GoogleGenAI({ apiKey: geminiApiKey });

export const env = {
  geminiApiKey,
  tavilyApiKey,
} as const;
