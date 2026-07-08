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
