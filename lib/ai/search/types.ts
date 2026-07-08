export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

export interface SearchProvider {
  search(query: string, options?: { maxResults?: number }): Promise<SearchResult[]>;
}
