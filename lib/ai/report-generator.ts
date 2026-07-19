import { withStreamingModelFallback, createChat } from "./model-router";
import type { WebSearchPlan } from "./tools";
import type { SummarizedSearch } from "./summarizer";
import type { ExecutedSearch } from "./executor";

/**
 * Lightweight deduplication of key facts across summaries.
 * Removes exact duplicates and near-duplicates (case-insensitive, ignoring trailing punctuation).
 */
function deduplicateKeyFacts(summaries: SummarizedSearch[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const summary of summaries) {
    for (const fact of summary.keyFacts) {
      const normalized = fact
        .toLowerCase()
        .replace(/[.!?;:,]+$/, "")
        .trim();
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      deduped.push(fact);
    }
  }

  return deduped;
}

function buildReportPromptFromSummaries(
  userText: string,
  plan: WebSearchPlan,
  summaries: SummarizedSearch[]
): string {
  const sortedSummaries = summaries.sort((a, b) => b.priority - a.priority);

  const summaryBlocks = sortedSummaries
    .map((summary, index) => {
      const sourceList = summary.sources
        .map((source) => `- ${source.title} (${source.url})`)
        .join("\n");

      return [
        `[Search ${index + 1}]`,
        `Query: ${summary.query}`,
        `Purpose: ${summary.purpose}`,
        `Priority: ${summary.priority}`,
        `Summary: ${summary.summary}`,
        "Sources:",
        sourceList || "- None",
      ].join("\n");
    })
    .join("\n\n");

  const dedupedFacts = deduplicateKeyFacts(sortedSummaries);
  const factsBlock = dedupedFacts.length
    ? dedupedFacts.map((fact) => `- ${fact}`).join("\n")
    : "- No key facts extracted.";

  const sectionsHint = plan.sections?.length
    ? `Suggested sections (follow them closely, but you may adapt or merge if it serves the user's question):\n${plan.sections
        .map((section) => `- ${section}`)
        .join("\n")}`
    : "";

  return [
    "You are an expert report writer. Write a clean, advanced report based only on the provided search summaries.",
    "Your job is to SYNTHESIZE, not summarize. Merge overlapping information, remove duplicates, resolve contradictions, and combine related points into one clear explanation.",
    "Weight each search by its Priority. High-priority searches should dominate the report; low-priority searches should only appear if they add useful detail.",
    "Start with a direct answer to the user's question. Then expand into the requested format.",
    "Do not over-explain tangential topics. Stay focused on what the user asked.",
    "If the summaries are insufficient, clearly state that limitation.",
    "",
    "=== Markdown Output Rules ===",
    "The chat application automatically renders Markdown using react-markdown.",
    "",
    "Default Behavior:",
    "- Return the final response as raw Markdown.",
    "- Do NOT wrap the entire response inside a fenced code block such as ```markdown ... ``` or ``` ... ```.",
    "- The response itself should be valid Markdown that renders immediately in the chat.",
    "- Use headings, paragraphs, lists, tables, links, blockquotes, bold, italics, and inline code normally.",
    "- Use fenced code blocks ONLY for actual code examples that are part of the content.",
    "",
    "When the User Requests a Markdown File:",
    "If the user explicitly asks for a .md file, the Markdown source, a copyable Markdown version, or 'give me this in markdown', do not replace the rendered document with a code block.",
    "Instead:",
    "1. First output the complete document as normal rendered Markdown.",
    "2. After the rendered document, add a 'Markdown Source' section.",
    "3. Wrap only the Markdown source in a fenced md code block.",
    "",
    "Never Do This:",
    "Do NOT return the entire response like ```markdown # Sample Document ... ``` because this prevents the chat UI from rendering the Markdown.",
    "",
    "=== User Prompt ===",
    userText,
    "",
    "=== Overall Goal ===",
    plan.overallGoal,
    "",
    "=== Target Audience ===",
    plan.targetAudience,
    "",
    "=== Output Format ===",
    plan.outputFormat,
    "",
    "=== Report Instructions ===",
    plan.reportInstructions,
    sectionsHint,
    "",
    "=== Search Summaries (sorted by priority) ===",
    summaryBlocks,
    "",
    "=== Deduplicated Key Facts ===",
    factsBlock,
    "",
    "=== Final Instructions ===",
    "Synthesize the above into the requested report format.",
    "Include inline source URLs as citations where appropriate.",
    "Do not introduce information that is not supported by the summaries.",
    "Do not list the search summaries one after another; combine them into a coherent report.",
  ].join("\n");
}

function buildReportPromptFromRawResults(
  userText: string,
  plan: WebSearchPlan,
  executedSearches: ExecutedSearch[]
): string {
  const sortedSearches = executedSearches.sort((a, b) => {
    // We don't have priority here, so keep original order.
    return 0;
  });

  const searchBlocks = sortedSearches
    .map((search, index) => {
      const sourceList = search.results
        .map((result) => `- ${result.title} (${result.url})`)
        .join("\n");

      const resultsText = search.results
        .map(
          (result, rIndex) =>
            `  [Result ${rIndex + 1}]\n  Title: ${result.title}\n  URL: ${result.url}\n  Content: ${result.content}`
        )
        .join("\n\n");

      return [
        `[Search ${index + 1}]`,
        `Query: ${search.query}`,
        `Purpose: ${search.purpose}`,
        "Results:",
        resultsText || "  No results found.",
        "Sources:",
        sourceList || "- None",
      ].join("\n");
    })
    .join("\n\n");

  const sectionsHint = plan.sections?.length
    ? `Suggested sections (follow them closely, but you may adapt or merge if it serves the user's question):\n${plan.sections
        .map((section) => `- ${section}`)
        .join("\n")}`
    : "";

  return [
    "You are an expert report writer. Write a clean, advanced report based on the provided web search results.",
    "Your job is to SYNTHESIZE. Filter out non-user-friendly details, merge overlapping information, remove duplicates, resolve contradictions, and combine related points into one clear explanation.",
    "Start with a direct answer to the user's question. Then expand into the requested format.",
    "Do not over-explain tangential topics. Stay focused on what the user asked.",
    "If the search results are insufficient, clearly state that limitation.",
    "",
    "=== Markdown Output Rules ===",
    "The chat application automatically renders Markdown using react-markdown.",
    "",
    "Default Behavior:",
    "- Return the final response as raw Markdown.",
    "- Do NOT wrap the entire response inside a fenced code block such as ```markdown ... ``` or ``` ... ```.",
    "- The response itself should be valid Markdown that renders immediately in the chat.",
    "- Use headings, paragraphs, lists, tables, links, blockquotes, bold, italics, and inline code normally.",
    "- Use fenced code blocks ONLY for actual code examples that are part of the content.",
    "",
    "When the User Requests a Markdown File:",
    "If the user explicitly asks for a .md file, the Markdown source, a copyable Markdown version, or 'give me this in markdown', do not replace the rendered document with a code block.",
    "Instead:",
    "1. First output the complete document as normal rendered Markdown.",
    "2. After the rendered document, add a 'Markdown Source' section.",
    "3. Wrap only the Markdown source in a fenced md code block.",
    "",
    "Never Do This:",
    "Do NOT return the entire response like ```markdown # Sample Document ... ``` because this prevents the chat UI from rendering the Markdown.",
    "",
    "=== User Prompt ===",
    userText,
    "",
    "=== Overall Goal ===",
    plan.overallGoal,
    "",
    "=== Target Audience ===",
    plan.targetAudience,
    "",
    "=== Output Format ===",
    plan.outputFormat,
    "",
    "=== Report Instructions ===",
    plan.reportInstructions,
    sectionsHint,
    "",
    "=== Web Search Results ===",
    searchBlocks,
    "",
    "=== Final Instructions ===",
    "Synthesize the above into the requested report format.",
    "Include inline source URLs as citations where appropriate.",
    "Do not introduce information that is not supported by the search results.",
    "Do not list the search results one after another; combine them into a coherent report.",
  ].join("\n");
}

/**
 * Streams the final report from Gemini.
 * Can consume either pre-summarized search data or raw executed search results.
 */
export async function generateReportStream(
  userText: string,
  plan: WebSearchPlan,
  input: { summaries: SummarizedSearch[] } | { rawResults: ExecutedSearch[] }
) {
  const prompt =
    "summaries" in input
      ? buildReportPromptFromSummaries(userText, plan, input.summaries)
      : buildReportPromptFromRawResults(userText, plan, input.rawResults);

  return withStreamingModelFallback(
    async (modelName) => {
      const chat = createChat(modelName);
      return chat.sendMessageStream({ message: prompt });
    },
    { label: "report-generator" }
  );
}
