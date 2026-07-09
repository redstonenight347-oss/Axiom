import { env } from "../config";
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

export class TavilySearchProvider implements SearchProvider {
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.tavily.com/search";

  constructor(apiKey: string = env.tavilyApiKey) {
    this.apiKey = apiKey;
  }

  async search(
    query: string,
    options: { maxResults?: number } = {}
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
}
