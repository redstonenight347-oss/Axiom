import { genAI, GEMINI_MODEL } from "./config";
import type { WebSearchPlan } from "./tools";
import type { SummarizedSearch } from "./summarizer";

/**
 * Builds a compact prompt for the final report generator from the plan and summaries.
 * Only summary-level data is included, never raw Tavily content, to stay within token limits.
 */
function buildReportPrompt(
  userText: string,
  plan: WebSearchPlan,
  summaries: SummarizedSearch[]
): string {
  const summaryBlocks = summaries
    .sort((a, b) => b.priority - a.priority)
    .map((summary, index) => {
      const sourceList = summary.sources
        .map((source) => `- ${source.title} (${source.url})`)
        .join("\n");

      const facts = summary.keyFacts.length
        ? summary.keyFacts.map((fact) => `- ${fact}`).join("\n")
        : "- No key facts extracted.";

      return [
        `[Search ${index + 1}]`,
        `Query: ${summary.query}`,
        `Purpose: ${summary.purpose}`,
        `Priority: ${summary.priority}`,
        `Summary: ${summary.summary}`,
        "Key Facts:",
        facts,
        "Sources:",
        sourceList || "- None",
      ].join("\n");
    })
    .join("\n\n");

  const sectionsHint = plan.sections?.length
    ? `Suggested sections (you may adapt but mostly follow them):\n${plan.sections
        .map((section) => `- ${section}`)
        .join("\n")}`
    : "";

  return [
    "You are an expert report writer. Write a clean, advanced report based only on the provided search summaries.",
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
    "=== Search Summaries ===",
    summaryBlocks,
    "",
    "=== Final Instructions ===",
    "Synthesize the summaries into the requested report format.",
    "Include inline source URLs as citations where appropriate.",
    "Do not introduce information that is not supported by the summaries.",
    "If the summaries are insufficient, clearly state that limitation.",
  ].join("\n");
}

/**
 * Streams the final report from Gemini.
 * Returns the async iterable stream so the caller can forward chunks to the client.
 */
export async function generateReportStream(
  userText: string,
  plan: WebSearchPlan,
  summaries: SummarizedSearch[]
) {
  const prompt = buildReportPrompt(userText, plan, summaries);

  const chat = genAI.chats.create({
    model: GEMINI_MODEL,
  });

  return chat.sendMessageStream({ message: prompt });
}
