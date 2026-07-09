import { FunctionCallingConfigMode } from "@google/genai";
import { genAI, GEMINI_MODEL } from "./config";
import {
  webSearchPlanToolDeclaration,
  WEB_SEARCH_PLAN_TOOL_NAME,
  type WebSearchPlan,
} from "./tools";

/**
 * Asks Gemini to plan which web searches are needed for the user's prompt.
 * Returns the reasoning and a list of queries with their purposes.
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
  const clampedSearches = (args.searches ?? []).slice(0, 5);

  return {
    reasoning: args.reasoning ?? "",
    searches: clampedSearches,
  };
}
