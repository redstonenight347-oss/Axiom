import { GoogleGenAI } from "@google/genai";

// Server-only environment configuration.
// This module reads secrets from process.env and constructs the Gemini client.
// It must never be imported by client components.

const geminiApiKey = process.env.GEMINI_API_KEY;
const tavilyApiKey = process.env.TAVILY_API_KEY;
const geminiEmbeddingModel = process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-2";

if (!geminiApiKey) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

if (!tavilyApiKey) {
  throw new Error("Missing TAVILY_API_KEY environment variable");
}

export const genAI = new GoogleGenAI({ apiKey: geminiApiKey });

export const env = {
  geminiApiKey,
  tavilyApiKey,
  geminiEmbeddingModel,
} as const;
