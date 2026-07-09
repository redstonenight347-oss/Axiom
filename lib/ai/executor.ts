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
 * Uses retry + timeout per query. Individual failures are captured in the
 * `error` field so the rest can continue.
 */
export async function executeSearchPlan(
  plan: SearchPlanItem[],
  options: { maxResults?: number } = {}
): Promise<ExecutedSearch[]> {
  const searchProvider = new TavilySearchProvider();

  const executions = plan.map(async (item) => {
    try {
      const results = await searchProvider.searchWithRetry(item.query, {
        maxResults: options.maxResults,
      });
      return {
        query: item.query,
        purpose: item.purpose,
        results,
      };
    } catch (error: any) {
      console.error(`[Executor] All retries failed for query "${item.query}": ${error.message}`);
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

/**
 * Returns true if every executed search has an error and no results were returned.
 */
export function allSearchesFailed(searches: ExecutedSearch[]): boolean {
  return searches.length > 0 && searches.every((search) => search.error || search.results.length === 0);
}
