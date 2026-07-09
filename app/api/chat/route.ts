import { NextRequest, NextResponse } from "next/server";
import {
  MAX_SEARCH_RESULTS_PER_QUERY,
  MAX_RAW_CHARS_FOR_DIRECT_REPORT,
} from "@/lib/ai/config";
import { planWebSearches } from "@/lib/ai/planner";
import { executeSearchPlan, allSearchesFailed } from "@/lib/ai/executor";
import { summarizeSearchResults } from "@/lib/ai/summarizer";
import { generateReportStream } from "@/lib/ai/report-generator";
import { withModelFallback, createChat } from "@/lib/ai/model-router";

function countRawResultChars(searches: { results: { content: string }[] }[]): number {
  return searches.reduce(
    (total, search) =>
      total +
      search.results.reduce((sum, result) => sum + (result.content?.length ?? 0), 0),
    0
  );
}

export async function POST(req: NextRequest) {
  // User verification here

  const { userText } = await req.json();

  if (!userText) {
    return NextResponse.json({ error: "Missing userText" }, { status: 400 });
  }

  const requestId = crypto.randomUUID();
  const logPrefix = `[Chat API ${requestId}]`;

  try {
    // -------------------------------------------------------------------------
    // 1. Planner: decide the cheapest viable strategy.
    // -------------------------------------------------------------------------
    let plan;
    try {
      console.log(`${logPrefix} Planning...`);
      plan = await planWebSearches(userText);
      console.log(`${logPrefix} Plan:`, JSON.stringify(plan, null, 2));
    } catch (err: any) {
      console.error(`${logPrefix} Planner failed:`, err);
      const isRateLimit =
        err.status === 429 ||
        err.message?.includes("Quota exceeded") ||
        err.message?.includes("quota");
      return NextResponse.json(
        {
          error: isRateLimit
            ? "Gemini API rate limit or daily quota exceeded. Please try again in a moment."
            : "Failed to plan response.",
        },
        { status: isRateLimit ? 429 : 502 }
      );
    }

    // If the planner wants clarification, stream the question back to the user.
    if (plan.askForClarification) {
      console.log(`${logPrefix} Asking for clarification.`);
      const clarificationStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(plan.askForClarification + "\n")
          );
          controller.close();
        },
      });
      return new Response(clarificationStream, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // If the planner can answer directly, stream its answer. Only 1 Gemini call.
    if (plan.strategy === "direct_answer") {
      console.log(`${logPrefix} Direct answer strategy. Streaming answer.`);
      const answer = plan.directAnswer ?? "I'm not sure how to answer that.";
      const directStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(answer + "\n"));
          controller.close();
        },
      });
      return new Response(directStream, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // -------------------------------------------------------------------------
    // 2. Execute all planned searches in parallel through Tavily.
    // -------------------------------------------------------------------------
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

    // If every search failed, stop and return a clear error instead of a broken report.
    if (allSearchesFailed(executedSearches)) {
      const failureDetails = executedSearches
        .map((s) => `  - "${s.query}": ${s.error}`)
        .join("\n");
      console.error(`${logPrefix} All web searches failed:\n${failureDetails}`);
      return NextResponse.json(
        {
          error:
            "All web searches failed. Please check your connection or try again in a moment.",
        },
        { status: 502 }
      );
    }

    // -------------------------------------------------------------------------
    // 3. Decide whether to summarize or pipe raw results straight to the report.
    //    Override the planner's recommendation based on token budget.
    // -------------------------------------------------------------------------
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
        ? await summarizeSearchResults(plan, executedSearches)
        : [];

    const summarizationFailures = summaries.filter((s) => s.error).length;
    if (summarizationFailures > 0) {
      console.error(`${logPrefix} ${summarizationFailures} summarization(s) failed.`);
    }

    // -------------------------------------------------------------------------
    // 4. Stream the final report back to the client.
    // -------------------------------------------------------------------------
    let responseStream;
    try {
      if (summaries.length > 0 && !summaries.every((s) => s.error)) {
        console.log(`${logPrefix} Generating report from summaries...`);
        responseStream = await generateReportStream(userText, plan, {
          summaries,
        });
      } else if (executedSearches.length > 0) {
        console.log(`${logPrefix} Generating report from raw search results...`);
        responseStream = await generateReportStream(userText, plan, {
          rawResults: executedSearches,
        });
      } else {
        console.log(`${logPrefix} No searches planned; answering directly.`);
        responseStream = await withModelFallback(
          async (modelName) => {
            const chat = createChat(modelName);
            return chat.sendMessageStream({ message: userText });
          },
          { label: "direct-answer" }
        );
      }
    } catch (err: any) {
      console.error(`${logPrefix} Final report stream call failed:`, err);
      const isRateLimit =
        err.status === 429 ||
        err.message?.includes("Quota exceeded") ||
        err.message?.includes("quota");
      return NextResponse.json(
        {
          error: isRateLimit
            ? "Gemini API rate limit or daily quota exceeded. Please try again in a moment."
            : "Failed to connect to Gemini API.",
        },
        { status: isRateLimit ? 429 : 502 }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            if (chunk.text) {
              // Ensure text chunks are sent with newlines as the frontend splits by \n
              controller.enqueue(new TextEncoder().encode(chunk.text + "\n"));
            }
          }
          console.log(`${logPrefix} Report stream completed.`);
        } catch (err) {
          console.error(`${logPrefix} Stream execution error:`, err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (err) {
    console.error(`${logPrefix} Internal server error:`, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
