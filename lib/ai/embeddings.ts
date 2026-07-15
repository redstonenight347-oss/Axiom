import { genAI, env } from "./config";

export const GEMINI_EMBEDDING_MODEL = env.geminiEmbeddingModel;

export interface EmbeddingResult {
  values: number[];
  model: string;
}

/**
 * Generates a dense embedding for the given text using the Gemini embedding API.
 * Returns a 3072-dimensional vector for gemini-embedding-2.
 */
export async function embedText(text: string): Promise<EmbeddingResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Cannot embed empty text");
  }

  const response = await genAI.models.embedContent({
    model: GEMINI_EMBEDDING_MODEL,
    contents: trimmed,
  });

  const values = response.embeddings?.[0]?.values;
  if (!values || values.length === 0) {
    throw new Error("Embedding API returned empty values");
  }

  return {
    values,
    model: GEMINI_EMBEDDING_MODEL,
  };
}

/**
 * Embeds multiple chunks in batches to respect rate limits.
 */
export async function embedChunks(chunks: string[], batchSize = 10): Promise<EmbeddingResult[]> {
  const results: EmbeddingResult[] = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((chunk) => embedText(chunk)));
    results.push(...batchResults);
  }

  return results;
}
