import { FunctionCallingConfigMode } from "@google/genai";
import { genAI, GEMINI_MODEL, MAX_PLANNER_SEARCHES } from "./config";
import {
  webSearchPlanToolDeclaration,
  WEB_SEARCH_PLAN_TOOL_NAME,
  type WebSearchPlan,
} from "./tools";

/**
 * Asks Gemini to plan how the user's prompt should be answered using live web data.
 * Returns a structured plan: what to search, what to extract, and how to assemble the final report.
 */
export async function planWebSearches(
  userText: string
): Promise<WebSearchPlan> {
  const chat = genAI.chats.create({
    model: GEMINI_MODEL,
    config: {
      tools: [{ functionDeclarations: [webSearchPlanToolDeclaration] }],
      toolConfig: {
        functionCallingConfig: {
          // Force the model to call the planner tool.
          mode: FunctionCallingConfigMode.ANY,
          allowedFunctionNames: [WEB_SEARCH_PLAN_TOOL_NAME],
        },
      },
    },
  });

  const response = await chat.sendMessage({
    message: userText,
  });

  const functionCall = response.candidates?.[0]?.content?.parts?.find(
    (part) => part.functionCall?.name === WEB_SEARCH_PLAN_TOOL_NAME
  )?.functionCall;

  if (!functionCall || !functionCall.args) {
    throw new Error("Planner did not return a valid function call");
  }

  const args = functionCall.args as WebSearchPlan;

  // Clamp the number of searches to the allowed range as a safety net.
  const clampedSearches = (args.searches ?? []).slice(0, MAX_PLANNER_SEARCHES);

  return {
    overallGoal: args.overallGoal ?? "Answer the user's question accurately.",
    targetAudience: args.targetAudience ?? "general audience",
    outputFormat: args.outputFormat ?? "markdown report",
    searches: clampedSearches,
    reportInstructions:
      args.reportInstructions ??
      "Synthesize the search summaries into a clear, accurate report.",
    sections: args.sections,
  };
}
