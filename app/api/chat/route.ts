import { NextRequest, NextResponse } from "next/server";
import { genAI, GEMINI_MODEL, MAX_SEARCH_RESULTS_PER_QUERY } from "@/lib/ai/config";
import { planWebSearches } from "@/lib/ai/planner";
import { executeSearchPlan } from "@/lib/ai/executor";
import { summarizeSearchResults } from "@/lib/ai/summarizer";
import { generateReportStream } from "@/lib/ai/report-generator";

export async function POST(req: NextRequest) {
  // User verification here

  const { userText } = await req.json();

  if (!userText) {
    return NextResponse.json({ error: "Missing userText" }, { status: 400 });
  }

  try {
    // -------------------------------------------------------------------------
    // 1. Planner: decide how to answer using live web data.
    // -------------------------------------------------------------------------
    let plan;
    try {
      plan = await planWebSearches(userText);
    } catch (err: any) {
      console.error("Planner failed:", err);
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

    // -------------------------------------------------------------------------
    // 3. Summarize each search query's results in parallel.
    //    One LLM call per query keeps free-tier usage low.
    // -------------------------------------------------------------------------
    const summaries =
      executedSearches.length > 0
        ? await summarizeSearchResults(plan, executedSearches)
        : [];

    // -------------------------------------------------------------------------
    // 4. Stream the final report back to the client.
    //    If no searches were planned, answer directly from the user's prompt.
    //    TODO: add fallback behavior here if desired (e.g. run a single broad
    //    search when the planner returns no queries).
    // -------------------------------------------------------------------------
    let responseStream;
    try {
      if (summaries.length > 0) {
        responseStream = await generateReportStream(userText, plan, summaries);
      } else {
        const chat = genAI.chats.create({ model: GEMINI_MODEL });
        responseStream = await chat.sendMessageStream({ message: userText });
      }
    } catch (err: any) {
      console.error("Final report stream call failed:", err);
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
        } catch (err) {
          console.error("Stream execution error:", err);
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
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
