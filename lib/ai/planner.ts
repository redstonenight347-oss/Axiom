import { FunctionCallingConfigMode } from "@google/genai";
import { MAX_PLANNER_SEARCHES } from "./constants";
import { withModelFallback, createChat } from "./model-router";
import {
  webSearchPlanToolDeclaration,
  WEB_SEARCH_PLAN_TOOL_NAME,
  type WebSearchPlan,
} from "./tools";

/**
 * Asks Gemini to decide the cheapest viable strategy for answering the user's prompt.
 * Returns a structured plan: strategy, optional direct answer, searches, and report instructions.
 */
export async function planWebSearches(
  userText: string
): Promise<WebSearchPlan> {
  const response = await withModelFallback(
    async (modelName) => {
      const chat = createChat(modelName);
      return chat.sendMessage({
        message: userText,
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
    },
    { label: "planner" }
  );

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
    strategy: args.strategy ?? "direct_answer",
    directAnswer: args.directAnswer,
    askForClarification: args.askForClarification,
    overallGoal: args.overallGoal ?? "Answer the user's question accurately.",
    targetAudience: args.targetAudience ?? "general audience",
    outputFormat: args.outputFormat ?? "raw markdown report that renders directly in a chat UI",
    searches: clampedSearches,
    needsSummarization: args.needsSummarization ?? false,
    reportInstructions:
      args.reportInstructions ??
      "Synthesize the search summaries into a clear, accurate report.",
    sections: args.sections,
  };
}
