import { z } from "zod";
import { Type, type FunctionDeclaration } from "@google/genai";

export const webSearchToolSchema = z.object({
  query: z.string().describe("A concise, targeted web search query."),
  maxResults: z
    .number()
    .int()
    .min(1)
    .max(10)
    .optional()
    .describe("Maximum number of results to return (1-10). Defaults to 5."),
});

export type WebSearchToolArgs = z.infer<typeof webSearchToolSchema>;

export const WEB_SEARCH_TOOL_NAME = "web_search";

export const webSearchToolDeclaration: FunctionDeclaration = {
  name: WEB_SEARCH_TOOL_NAME,
  description:
    "Search the live web for current, factual, or up-to-date information. " +
    "Use this when the user asks about recent events, current data, or anything " +
    "that may have changed after the model's knowledge cutoff.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "A concise, targeted web search query.",
      },
      maxResults: {
        type: Type.INTEGER,
        description: "Maximum number of results to return (1-10). Defaults to 5.",
        minimum: 1,
        maximum: 10,
      },
    },
    required: ["query"],
  },
};

// ---------------------------------------------------------------------------
// Planner tool: the model decides which web searches are needed and why.
// ---------------------------------------------------------------------------

export const webSearchPlanSchema = z.object({
  strategy: z
    .enum([
      "direct_answer",
      "web_search_direct_report",
      "web_search_then_report",
    ])
    .describe(
      "The execution strategy. direct_answer = answer now with no web search. web_search_direct_report = search then generate report from raw results. web_search_then_report = search, summarize, then generate report."
    ),
  directAnswer: z
    .string()
    .optional()
    .describe(
      "If strategy is direct_answer, the final answer to stream to the user."
    ),
  askForClarification: z
    .string()
    .optional()
    .describe(
      "If the prompt is unclear and you are unsure which strategy to use, ask the user a clarifying question instead of guessing."
    ),
  overallGoal: z
    .string()
    .optional()
    .describe(
      "What the final report should accomplish for the user. Be specific about the desired outcome."
    ),
  targetAudience: z
    .string()
    .optional()
    .describe(
      "Who the report is for and the desired depth/tone, e.g. 'technical expert', 'beginner', 'executive summary'."
    ),
  outputFormat: z
    .string()
    .optional()
    .describe(
      "The format the final report should take, e.g. 'markdown report with headings, bullets, and a short summary'."
    ),
  searches: z
    .array(
      z.object({
        query: z.string().describe("A concise, targeted web search query."),
        purpose: z
          .string()
          .describe(
            "Why this query is needed and what information it should retrieve."
          ),
        whatToExtract: z
          .string()
          .describe(
            "What the downstream summarizer should extract from the search results for this query."
          ),
        priority: z
          .number()
          .int()
          .min(1)
          .max(5)
          .describe(
            "Importance of this query for the final report (1 = low, 5 = critical)."
          ),
      })
    )
    .min(0)
    .max(5)
    .describe(
      "List of web search queries to run (0-5). Only include queries that are likely to retrieve current or factual information not known to the model."
    ),
  needsSummarization: z
    .boolean()
    .describe(
      "Whether the search results should be summarized per query before generating the report. The backend may override this if the raw results are small enough."
    ),
  reportInstructions: z
    .string()
    .optional()
    .describe(
      "Detailed instructions for how the final report generator should synthesize the summaries into the output."
    ),
  sections: z
    .array(z.string())
    .optional()
    .describe(
      "Suggested section headings for the final report. The report generator may adapt these but should mostly follow them."
    ),
});

export type WebSearchPlan = z.infer<typeof webSearchPlanSchema>;

export const WEB_SEARCH_PLAN_TOOL_NAME = "plan_web_searches";

export const webSearchPlanToolDeclaration: FunctionDeclaration = {
  name: WEB_SEARCH_PLAN_TOOL_NAME,
  description:
    "Decide the cheapest way to answer the user's prompt accurately. " +
    "Choose direct_answer for basic questions that need no web data. " +
    "Choose web_search_direct_report when web data is needed but results are likely small/simple. " +
    "Choose web_search_then_report for deep, complex, or multi-topic questions. " +
    "If you are genuinely unsure what the user wants, use askForClarification instead of guessing.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      strategy: {
        type: Type.STRING,
        description:
          "The execution strategy. Must be one of: direct_answer, web_search_direct_report, web_search_then_report.",
      },
      directAnswer: {
        type: Type.STRING,
        description:
          "If strategy is direct_answer, the final answer to stream to the user. Keep it clear and complete.",
      },
      askForClarification: {
        type: Type.STRING,
        description:
          "If the prompt is unclear and you are unsure which strategy to use, ask the user a clarifying question instead of guessing.",
      },
      overallGoal: {
        type: Type.STRING,
        description:
          "What the final report should accomplish for the user. Be specific about the desired outcome.",
      },
      targetAudience: {
        type: Type.STRING,
        description:
          "Who the report is for and the desired depth/tone, e.g. 'technical expert', 'beginner', 'executive summary'.",
      },
      outputFormat: {
        type: Type.STRING,
        description:
          "The format the final report should take, e.g. 'markdown report with headings, bullets, and a short summary'.",
      },
      searches: {
        type: Type.ARRAY,
        description:
          "List of web search queries to run (0-5). Only include queries that are likely to retrieve current or factual information not known to the model.",
        items: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description: "A concise, targeted web search query.",
            },
            purpose: {
              type: Type.STRING,
              description:
                "Why this query is needed and what information it should retrieve.",
            },
            whatToExtract: {
              type: Type.STRING,
              description:
                "What the downstream summarizer should extract from the search results for this query.",
            },
            priority: {
              type: Type.INTEGER,
              description:
                "Importance of this query for the final report (1 = low, 5 = critical).",
              minimum: 1,
              maximum: 5,
            },
          },
          required: ["query", "purpose", "whatToExtract", "priority"],
        },
      },
      needsSummarization: {
        type: Type.BOOLEAN,
        description:
          "Whether the search results should be summarized per query before generating the report. The backend may override this if the raw results are small enough.",
      },
      reportInstructions: {
        type: Type.STRING,
        description:
          "Detailed instructions for how the final report generator should synthesize the summaries into the output.",
      },
      sections: {
        type: Type.ARRAY,
        description:
          "Suggested section headings for the final report. The report generator may adapt these but should mostly follow them.",
        items: {
          type: Type.STRING,
        },
      },
    },
    required: ["strategy", "searches", "needsSummarization"],
  },
};
