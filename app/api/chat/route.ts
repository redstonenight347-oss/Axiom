import { NextRequest, NextResponse } from "next/server";
import { genAI, GEMINI_MODEL, MAX_SEARCH_RESULTS_PER_QUERY } from "@/lib/ai/config";
import { planWebSearches } from "@/lib/ai/planner";
import { executeSearchPlan, allSearchesFailed } from "@/lib/ai/executor";
import { summarizeSearchResults } from "@/lib/ai/summarizer";
import { generateReportStream } from "@/lib/ai/report-generator";

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
    // 1. Planner: decide how to answer using live web data.
    // -------------------------------------------------------------------------
    let plan;
    try {
      console.log(`${logPrefix} Planning searches...`);
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
            : "Failed to plan web searches.",
        },
        { status: isRateLimit ? 429 : 502 }
      );
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
    // 3. Summarize each search query's results in parallel.
    //    One LLM call per query keeps free-tier usage low.
    // -------------------------------------------------------------------------
    const summaries =
      executedSearches.length > 0
        ? await summarizeSearchResults(plan, executedSearches)
        : [];

    const summarizationFailures = summaries.filter((s) => s.error).length;
    if (summarizationFailures > 0) {
      console.error(`${logPrefix} ${summarizationFailures} summarization(s) failed.`);
    }

    // -------------------------------------------------------------------------
    // 4. Stream the final report back to the client.
    //    If no searches were planned, answer directly from the user's prompt.
    //    TODO: add fallback behavior here if desired (e.g. run a single broad
    //    search when the planner returns no queries).
    // -------------------------------------------------------------------------
    let responseStream;
    try {
      if (summaries.length > 0) {
        console.log(`${logPrefix} Generating report stream...`);
        responseStream = await generateReportStream(userText, plan, summaries);
      } else {
        console.log(`${logPrefix} No searches planned; answering directly.`);
        const chat = genAI.chats.create({ model: GEMINI_MODEL });
        responseStream = await chat.sendMessageStream({ message: userText });
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
