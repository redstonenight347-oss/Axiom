import { MAX_RESULT_CONTENT_CHARS, MAX_SUMMARY_CHARS } from "./constants";
import { withModelFallback } from "./model-router";
import { incrementModelUsage } from "@/services/model-usage";
import type { ExecutedSearch } from "./executor";

export interface SummarizedSearch {
  query: string;
  purpose: string;
  priority: number;
  summary: string;
  keyFacts: string[];
  sources: { title: string; url: string }[];
  error?: string;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}

/**
 * Summarizes the results of a single executed search into a compact, query-focused summary.
 * This is one LLM call per search query, keeping free-tier usage low.
 */
async function summarizeOneSearch(
  search: ExecutedSearch,
  whatToExtract: string,
  priority: number,
  userId?: string
): Promise<SummarizedSearch> {
  if (search.error || search.results.length === 0) {
    return {
      query: search.query,
      purpose: search.purpose,
      priority,
      summary: search.error ? `Search failed: ${search.error}` : "No results found.",
      keyFacts: [],
      sources: [],
      error: search.error,
    };
  }

  const sources = search.results.map((result) => ({
    title: result.title,
    url: result.url,
  }));

  const resultsContext = search.results
    .map(
      (result, index) =>
        `[Result ${index + 1}]\nTitle: ${result.title}\nURL: ${result.url}\nContent: ${truncate(
          result.content,
          MAX_RESULT_CONTENT_CHARS
        )}`
    )
    .join("\n\n");

  const prompt = [
    "You are a research assistant. Read the search results below and produce a concise, query-focused summary.",
    "Focus tightly on the user's core question. Ignore tangential or background information unless it is directly needed to answer.",
    "",
    "=== Search Query ===",
    search.query,
    "",
    "=== Purpose ===",
    search.purpose,
    "",
    "=== What to Extract ===",
    whatToExtract,
    "",
    "=== Search Results ===",
    resultsContext,
    "",
    "=== Output Instructions ===",
    `Write a clear, focused summary in at most ${MAX_SUMMARY_CHARS} characters.`,
    "Then list 3-7 key facts or important details as bullet points.",
    "Each fact must directly help answer the user's question.",
    "Do not include information that is not supported by the results.",
    "Do not add background context that is not relevant to the query.",
  ].join("\n");

  try {
    const response = await withModelFallback(
      async (modelName) => {
        const { GoogleGenAI } = await import("@google/genai");
        const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        return genAI.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction:
              "Return only the summary followed by a 'Key Facts:' section. Be concise, factual, and tightly focused on the query. Avoid tangents.",
          },
        });
      },
      { label: `summarizer: ${search.query.slice(0, 40)}` }
    );

    const usedModel = response.modelVersion ?? undefined;
    if (userId && usedModel) {
      const tokens =
        response.usageMetadata?.totalTokenCount ??
        ((response.usageMetadata?.promptTokenCount ?? 0) +
          (response.usageMetadata?.candidatesTokenCount ?? 0));
      await incrementModelUsage({ userId, model: usedModel, requests: 1, tokens });
    }

    const text = response.text ?? "";
    const [summaryPart, ...keyFactsParts] = text.split(/\n*Key Facts:\n*/i);
    const summary = summaryPart.trim();
    const keyFacts = keyFactsParts
      .join("\n")
      .split("\n")
      .map((line) => line.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean);

    return {
      query: search.query,
      purpose: search.purpose,
      priority,
      summary,
      keyFacts,
      sources,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Summarization failed";
    return {
      query: search.query,
      purpose: search.purpose,
      priority,
      summary: `Summarization failed: ${message}`,
      keyFacts: [],
      sources,
      error: message,
    };
  }
}

/**
 * Summarizes each executed search in parallel.
 * The plan tells each summarizer what to extract and the priority of the query.
 */
export async function summarizeSearchResults(
  plan: {
    searches: {
      query: string;
      purpose: string;
      whatToExtract: string;
      priority: number;
    }[];
  },
  executedSearches: ExecutedSearch[],
  userId?: string
): Promise<SummarizedSearch[]> {
  const planByQuery = new Map(
    plan.searches.map((item) => [item.query, item])
  );

  const summaries = executedSearches.map(async (search) => {
    const planItem = planByQuery.get(search.query);
    const whatToExtract = planItem?.whatToExtract ?? "Extract the most relevant information.";
    const priority = planItem?.priority ?? 3;
    return summarizeOneSearch(search, whatToExtract, priority, userId);
  });

  return Promise.all(summaries);
}
