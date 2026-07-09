import {
  env,
  TAVILY_TIMEOUT_MS,
  TAVILY_MAX_RETRIES,
  TAVILY_RETRY_BASE_DELAY_MS,
} from "../config";
import type { SearchProvider, SearchResult } from "./types";

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

interface TavilyResponse {
  results?: TavilyResult[];
  answer?: string;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class TavilySearchProvider implements SearchProvider {
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.tavily.com/search";

  constructor(apiKey: string = env.tavilyApiKey) {
    this.apiKey = apiKey;
  }

  async search(
    query: string,
    options: { maxResults?: number; signal?: AbortSignal } = {}
  ): Promise<SearchResult[]> {
    const maxResults = Math.min(Math.max(options.maxResults ?? 2, 1), 10);

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: this.apiKey,
        query,
        search_depth: "advanced",
        max_results: maxResults,
        include_answer: false,
        include_images: false,
        include_raw_content: false,
      }),
      signal: options.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "Unknown error");
      throw new Error(`Tavily search failed: ${response.status} ${text}`);
    }

    const data = (await response.json()) as TavilyResponse;

    return (data.results ?? []).map((result) => ({
      title: result.title,
      url: result.url,
      content: result.content,
      score: result.score,
    }));
  }

  /**
   * Searches with a per-attempt timeout and exponential backoff retries.
   * Logs each attempt and failure for observability.
   */
  async searchWithRetry(
    query: string,
    options: { maxResults?: number } = {}
  ): Promise<SearchResult[]> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= TAVILY_MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TAVILY_TIMEOUT_MS);

        const results = await this.search(query, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (attempt > 1) {
          console.log(`[Tavily] Search succeeded on attempt ${attempt} for query: ${query}`);
        }

        return results;
      } catch (error: any) {
        lastError = error;
        const isTimeout = error.name === "AbortError" || error.message?.includes("abort");
        const errorMessage = isTimeout
          ? `Tavily request timed out after ${TAVILY_TIMEOUT_MS}ms`
          : error.message ?? "Unknown error";

        console.error(
          `[Tavily] Search attempt ${attempt}/${TAVILY_MAX_RETRIES} failed for query "${query}": ${errorMessage}`
        );

        if (attempt < TAVILY_MAX_RETRIES) {
          const backoffMs = TAVILY_RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
          console.log(`[Tavily] Retrying in ${backoffMs}ms...`);
          await delay(backoffMs);
        }
      }
    }

    throw new Error(
      `Tavily search failed after ${TAVILY_MAX_RETRIES} attempts. Last error: ${lastError?.message ?? "Unknown"}`
    );
  }
}
