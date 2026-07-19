import {
  MAX_SEARCH_RESULTS_PER_QUERY,
  MAX_RAW_CHARS_FOR_DIRECT_REPORT,
} from "@/lib/ai/constants";
import { planWebSearches } from "@/lib/ai/planner";
import { executeSearchPlan, allSearchesFailed } from "@/lib/ai/executor";
import { summarizeSearchResults } from "@/lib/ai/summarizer";
import { generateReportStream } from "@/lib/ai/report-generator";
import { withModelFallback, createChat } from "@/lib/ai/model-router";
import { persistAssistantMessage, touchChat } from "./chat-session";
import { incrementModelUsage } from "./model-usage";
import { sseStatus, sseContent } from "./sse";
import { isRateLimitError, getRateLimitMessage } from "./error-helpers";
import type { WebSearchPlan } from "@/lib/ai/tools";

export interface PipelineInput {
  requestId: string;
  activeChatId: string;
  assistantMessageId: string;
  userText: string;
  promptText: string;
  hasDocuments?: boolean;
  preferredModel?: string | null;
  userId?: string;
}

export type PipelineResult =
  | { type: "stream"; stream: ReadableStream<Uint8Array> }
  | { type: "error"; error: string; status: number };

export async function runChatPipeline({
  requestId,
  activeChatId,
  assistantMessageId,
  promptText,
  hasDocuments,
  preferredModel,
  userId,
}: PipelineInput): Promise<PipelineResult> {
  const logPrefix = `[Chat API ${requestId}]`;

  // When documents are attached, skip the web-search planner and answer directly
  // from the document-aware prompt so the retrieved chunks are not discarded.
  if (hasDocuments) {
    console.log(`${logPrefix} Documents attached; skipping planner and answering from retrieved chunks.`);
    return answerDirectly({ requestId, activeChatId, assistantMessageId, promptText, preferredModel, userId });
  }

  // 1. Planner: decide the cheapest viable strategy.
  let plan: WebSearchPlan;
  try {
    console.log(`${logPrefix} Planning...`);
    plan = await planWebSearches(promptText, userId);
    console.log(`${logPrefix} Plan:`, JSON.stringify(plan, null, 2));
  } catch (err: unknown) {
    console.error(`${logPrefix} Planner failed:`, err);
    const rateLimited = isRateLimitError(err);
    const errorContent = rateLimited
      ? getRateLimitMessage()
      : "Failed to plan response.";

    await persistAssistantMessage({
      id: assistantMessageId,
      chatId: activeChatId,
      content: errorContent,
      error: true,
    });

    return { type: "error", error: errorContent, status: rateLimited ? 429 : 502 };
  }

  // 2. Short-circuit: ask for clarification.
  if (plan.askForClarification) {
    console.log(`${logPrefix} Asking for clarification.`);
    await persistAssistantMessage({
      id: assistantMessageId,
      chatId: activeChatId,
      content: plan.askForClarification,
      error: false,
    });

    return {
      type: "stream",
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue(sseStatus("Thinking..."));
          controller.enqueue(sseContent(plan.askForClarification ?? ""));
          controller.close();
        },
      }),
    };
  }

  // 3. Short-circuit: direct answer.
  if (plan.strategy === "direct_answer") {
    console.log(`${logPrefix} Direct answer strategy. Streaming answer.`);
    const answer = plan.directAnswer ?? "I'm not sure how to answer that.";

    await persistAssistantMessage({
      id: assistantMessageId,
      chatId: activeChatId,
      content: answer,
      error: false,
    });

    return {
      type: "stream",
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue(sseStatus("Generating Report..."));
          controller.enqueue(sseContent(answer));
          controller.close();
        },
      }),
    };
  }

  // 4. Execute all planned searches in parallel through Tavily.
  const executedSearches =
    plan.searches.length > 0
      ? await executeSearchPlan(plan.searches, {
          maxResults: MAX_SEARCH_RESULTS_PER_QUERY,
        })
      : [];

  console.log(
    `${logPrefix} Executed ${executedSearches.length} searches. Failed: ${
      executedSearches.filter((s) => s.error).length
    }`
  );

  if (allSearchesFailed(executedSearches)) {
    const failureDetails = executedSearches
      .map((s) => `  - "${s.query}": ${s.error}`)
      .join("\n");
    console.error(`${logPrefix} All web searches failed:\n${failureDetails}`);

    const errorContent =
      "All web searches failed. Please check your connection or try again in a moment.";
    await persistAssistantMessage({
      id: assistantMessageId,
      chatId: activeChatId,
      content: errorContent,
      error: true,
    });

    return { type: "error", error: errorContent, status: 502 };
  }

  // 5. Decide whether to summarize or pipe raw results straight to the report.
  const rawResultChars = countRawResultChars(executedSearches);
  const shouldSummarize =
    plan.needsSummarization &&
    plan.searches.length > 2 &&
    rawResultChars > MAX_RAW_CHARS_FOR_DIRECT_REPORT;

  console.log(
    `${logPrefix} Raw result chars: ${rawResultChars}. Will summarize: ${shouldSummarize}`
  );

  const summaries =
    shouldSummarize && executedSearches.length > 0
      ? await summarizeSearchResults(plan, executedSearches, userId)
      : [];

  const summarizationFailures = summaries.filter((s) => s.error).length;
  if (summarizationFailures > 0) {
    console.error(`${logPrefix} ${summarizationFailures} summarization(s) failed.`);
  }

  // 6. Build the final response stream.
  let reportResult: Awaited<ReturnType<typeof generateReportStream>> | undefined;
  let responseStream: AsyncIterable<{ text?: string; usageMetadata?: unknown }>;
  try {
    if (summaries.length > 0 && !summaries.every((s) => s.error)) {
      console.log(`${logPrefix} Generating report from summaries...`);
      reportResult = await generateReportStream(promptText, plan, { summaries });
      responseStream = reportResult.result;
    } else if (executedSearches.length > 0) {
      console.log(`${logPrefix} Generating report from raw search results...`);
      reportResult = await generateReportStream(promptText, plan, {
        rawResults: executedSearches,
      });
      responseStream = reportResult.result;
    } else {
      console.log(`${logPrefix} No searches planned; answering directly.`);
      responseStream = await withModelFallback(
        async (modelName) => {
          const chatSession = createChat(modelName);
          return chatSession.sendMessageStream({ message: promptText });
        },
        { label: "direct-answer", preferredModel }
      );
    }
  } catch (err: unknown) {
    console.error(`${logPrefix} Final report stream call failed:`, err);
    const rateLimited = isRateLimitError(err);
    const errorContent = rateLimited
      ? getRateLimitMessage()
      : "Failed to connect to Gemini API.";

    await persistAssistantMessage({
      id: assistantMessageId,
      chatId: activeChatId,
      content: errorContent,
      error: true,
    });

    return { type: "error", error: errorContent, status: rateLimited ? 429 : 502 };
  }

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(sseStatus("Generating report..."));

      let fullContent = "";
      try {
        for await (const chunk of responseStream) {
          if (chunk.text) {
            controller.enqueue(sseContent(chunk.text));
            fullContent += chunk.text;
          }
        }
        console.log(`${logPrefix} Report stream completed.`);
      } catch (err) {
        console.error(`${logPrefix} Stream execution error:`, err);
        controller.error(err);
        return;
      }

      controller.close();

      if (userId && reportResult) {
        const streamTokens = (responseStream as unknown as { tokensUsed?: number }).tokensUsed;
        const tokens =
          streamTokens ??
          reportResult.tokensUsed ??
          0;
        await incrementModelUsage({
          userId,
          model: reportResult.modelName,
          requests: 1,
          tokens,
        });
      }

      await persistAssistantMessage({
        id: assistantMessageId,
        chatId: activeChatId,
        content: fullContent,
        error: false,
      });

      await touchChat(activeChatId);
    },
  });

  return { type: "stream", stream };
}

interface DirectAnswerInput {
  requestId: string;
  activeChatId: string;
  assistantMessageId: string;
  promptText: string;
}

async function answerDirectly({
  requestId,
  activeChatId,
  assistantMessageId,
  promptText,
  preferredModel,
  userId,
}: DirectAnswerInput & { preferredModel?: string | null; userId?: string }): Promise<PipelineResult> {
  const logPrefix = `[Chat API ${requestId}]`;

  let responseStream;
  let directModelName: string | undefined;
  try {
    console.log(`${logPrefix} Answering directly from document-aware prompt.`);
    responseStream = await withModelFallback(
      async (modelName) => {
        directModelName = modelName;
        const chatSession = createChat(modelName);
        return chatSession.sendMessageStream({ message: promptText });
      },
      { label: "document-answer", preferredModel }
    );
  } catch (err: unknown) {
    console.error(`${logPrefix} Direct answer stream failed:`, err);
    const rateLimited = isRateLimitError(err);
    const errorContent = rateLimited
      ? getRateLimitMessage()
      : "Failed to connect to Gemini API.";

    await persistAssistantMessage({
      id: assistantMessageId,
      chatId: activeChatId,
      content: errorContent,
      error: true,
    });

    return { type: "error", error: errorContent, status: rateLimited ? 429 : 502 };
  }

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(sseStatus("Reading documents..."));

      let fullContent = "";
      try {
        for await (const chunk of responseStream) {
          if (chunk.text) {
            controller.enqueue(sseContent(chunk.text));
            fullContent += chunk.text;
          }
        }
        console.log(`${logPrefix} Document answer stream completed.`);
      } catch (err) {
        console.error(`${logPrefix} Stream execution error:`, err);
        controller.error(err);
        return;
      }

      controller.close();

      if (userId && directModelName) {
        const streamTokens = (responseStream as unknown as { tokensUsed?: number }).tokensUsed;
        await incrementModelUsage({
          userId,
          model: directModelName,
          requests: 1,
          tokens: streamTokens ?? 0,
        });
      }

      await persistAssistantMessage({
        id: assistantMessageId,
        chatId: activeChatId,
        content: fullContent,
        error: false,
      });

      await touchChat(activeChatId);
    },
  });

  return { type: "stream", stream };
}

function countRawResultChars(searches: { results: { content: string }[] }[]): number {
  return searches.reduce(
    (total, search) =>
      total +
      search.results.reduce((sum, result) => sum + (result.content?.length ?? 0), 0),
    0
  );
}
