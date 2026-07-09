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
  reasoning: z
    .string()
    .describe(
      "A short explanation of why web searches are or are not needed for this prompt."
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
      })
    )
    .min(0)
    .max(5)
    .describe(
      "List of web search queries to run (0-5). Only include queries that are likely to retrieve current or factual information not known to the model."
    ),
});

export type WebSearchPlan = z.infer<typeof webSearchPlanSchema>;

export const WEB_SEARCH_PLAN_TOOL_NAME = "plan_web_searches";

export const webSearchPlanToolDeclaration: FunctionDeclaration = {
  name: WEB_SEARCH_PLAN_TOOL_NAME,
  description:
    "Plan which web searches are needed to answer the user's prompt accurately. " +
    "For each search, provide a targeted query and a clear purpose so the results can be used " +
    "to ground the final answer and avoid hallucination. Return an empty list if no searches are needed.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      reasoning: {
        type: Type.STRING,
        description:
          "A short explanation of why web searches are or are not needed for this prompt.",
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
          },
          required: ["query", "purpose"],
        },
      },
    },
    required: ["reasoning", "searches"],
  },
};
