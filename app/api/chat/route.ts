import { NextRequest, NextResponse } from "next/server";
import { genAI, GEMINI_MODEL } from "@/lib/ai/config";
import { planWebSearches } from "@/lib/ai/planner";
import { executeSearchPlan } from "@/lib/ai/executor";

export async function POST(req: NextRequest) {
  // User verification here

  const { userText } = await req.json();

  if (!userText) {
    return NextResponse.json({ error: "Missing userText" }, { status: 400 });
  }

  try {
    // -------------------------------------------------------------------------
    // 1. Planner: ask Gemini which searches are needed and why.
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

console.log("===== PLAN =====");
console.dir(plan, { depth: null });

    // -------------------------------------------------------------------------
    // 2. Execute all planned searches in parallel through Tavily.
    // -------------------------------------------------------------------------
    const executedSearches =
      plan.searches.length > 0
        ? await executeSearchPlan(plan.searches, { maxResults: 2 })
        : [];

console.log("===== EXECUTED SEARCHES =====");
console.dir(executedSearches, { depth: 2 });

    // -------------------------------------------------------------------------
    // 3. Build a grounded prompt for the final answer.
    //    If no searches were planned, answer directly from the user's prompt.
    //    TODO: add fallback behavior here if desired (e.g. run a single broad
    //    search when the planner returns no queries).
    // -------------------------------------------------------------------------
    let finalPrompt = userText;

    if (executedSearches.length > 0) {
      const searchContext = executedSearches
        .map((search, index) => {
          const header = `[Search ${index + 1}]\nQuery: ${search.query}\nPurpose: ${search.purpose}`;

          if (search.error) {
            return `${header}\nError: ${search.error}`;
          }

          const results = search.results
            .map(
              (result, rIndex) =>
                `  [Result ${rIndex + 1}]\n  Title: ${result.title}\n  URL: ${result.url}\n  Content: ${result.content}`
            )
            .join("\n");

          return `${header}\nResults:\n${results || "  No results found."}`;
        })
        .join("\n\n");

      finalPrompt = [
        "Use the following web search results to answer the user's question accurately.",
        "Base your answer only on the provided results. If the results do not contain enough information, say so.",
        "",
        "=== User Question ===",
        userText,
        "",
        "=== Web Search Results ===",
        searchContext,
      ].join("\n");
    }

    // -------------------------------------------------------------------------
    // 4. Stream the final answer back to the client in the same format as before.
    // -------------------------------------------------------------------------
    const chat = genAI.chats.create({
      model: GEMINI_MODEL,
    });

    // Fetch the initial stream response before creating the ReadableStream
    // so we can catch quota/rate-limit errors early and return a proper HTTP status.
    let responseStream;
    try {
      responseStream = await chat.sendMessageStream({ message: finalPrompt });
    } catch (err: any) {
      console.error("Final answer stream call failed:", err);
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

console.log("Prompt length:", finalPrompt.length);

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