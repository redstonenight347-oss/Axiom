import { GoogleGenAI } from "@google/genai";

const geminiApiKey = process.env.GEMINI_API_KEY;
const tavilyApiKey = process.env.TAVILY_API_KEY;

if (!geminiApiKey) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

if (!tavilyApiKey) {
  throw new Error("Missing TAVILY_API_KEY environment variable");
}

export const GEMINI_MODEL = "gemini-3.5-flash";

export const genAI = new GoogleGenAI({ apiKey: geminiApiKey });

export const env = {
  geminiApiKey,
  tavilyApiKey,
} as const;
