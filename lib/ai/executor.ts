import type { SearchResult } from "./search/types";
import { TavilySearchProvider } from "./search/tavily";

export interface SearchPlanItem {
  query: string;
  purpose: string;
}

export interface ExecutedSearch {
  query: string;
  purpose: string;
  results: SearchResult[];
  error?: string;
}

/**
 * Runs each planned search query independently through Tavily in parallel.
 * Individual failures are captured in the `error` field so the rest can continue.
 */
export async function executeSearchPlan(
  plan: SearchPlanItem[],
  options: { maxResults?: number } = {}
): Promise<ExecutedSearch[]> {
  const searchProvider = new TavilySearchProvider();

  const executions = plan.map(async (item) => {
    try {
      const results = await searchProvider.search(item.query, {
        maxResults: options.maxResults,
      });
      return {
        query: item.query,
        purpose: item.purpose,
        results,
      };
    } catch (error: any) {
      return {
        query: item.query,
        purpose: item.purpose,
        results: [],
        error: error.message ?? "Search failed",
      };
    }
  });

  return Promise.all(executions);
}
