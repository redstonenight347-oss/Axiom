import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chat, message } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  MAX_SEARCH_RESULTS_PER_QUERY,
  MAX_RAW_CHARS_FOR_DIRECT_REPORT,
  MAX_HISTORY_MESSAGES,
} from "@/lib/ai/config";
import { planWebSearches } from "@/lib/ai/planner";
import { executeSearchPlan, allSearchesFailed } from "@/lib/ai/executor";
import { summarizeSearchResults } from "@/lib/ai/summarizer";
import { generateReportStream } from "@/lib/ai/report-generator";
import { withModelFallback, createChat } from "@/lib/ai/model-router";
import type { Message } from "@/app/chats/types";

function countRawResultChars(searches: { results: { content: string }[] }[]): number {
  return searches.reduce(
    (total, search) =>
      total +
      search.results.reduce((sum, result) => sum + (result.content?.length ?? 0), 0),
    0
  );
}

function truncateTitle(text: string, maxLength = 60): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength).trimEnd() + "…";
}

function getHistoryMessages(messages: Message[]): Message[] {
  if (MAX_HISTORY_MESSAGES <= 0) return [];
  return messages.slice(-MAX_HISTORY_MESSAGES);
}

function buildPromptWithHistory(userText: string, history: Message[]): string {
  if (history.length === 0) return userText;

  const historyText = history
    .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
    .join("\n\n");

  return [
    "Continue the following conversation. Use the prior messages as context when answering.",
    "",
    "=== Conversation history ===",
    historyText,
    "",
    "=== Latest user message ===",
    userText,
  ].join("\n");
}

function sseStatus(status: string) {
  return new TextEncoder().encode(`event: status\ndata: ${status}\n\n`);
}

function sseContent(text: string) {
  return new TextEncoder().encode(`event: content\ndata: ${JSON.stringify(text)}\n\n`);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json().catch(() => ({}));
  const { chatId, userText, messages = [] } = body;

  if (!userText || typeof userText !== "string") {
    return NextResponse.json({ error: "Missing userText" }, { status: 400 });
  }

  const requestId = crypto.randomUUID();
  const logPrefix = `[Chat API ${requestId}]`;

  try {
    // -------------------------------------------------------------------------
    // 1. Resolve or create the chat and persist the user message.
    // -------------------------------------------------------------------------
    let activeChatId = chatId;

    if (activeChatId) {
      const existingChat = await db.query.chat.findFirst({
        where: and(eq(chat.id, activeChatId), eq(chat.userId, userId)),
      });
      if (!existingChat) {
        return NextResponse.json({ error: "Chat not found" }, { status: 404 });
      }
    } else {
      const [newChat] = await db
        .insert(chat)
        .values({
          id: crypto.randomUUID(),
          userId,
          title: truncateTitle(userText),
        })
        .returning();
      activeChatId = newChat.id;
    }

    const userMessageId = crypto.randomUUID();
    await db.insert(message).values({
      id: userMessageId,
      chatId: activeChatId,
      role: "user",
      content: userText,
      error: false,
    });

    const assistantMessageId = crypto.randomUUID();

    // -------------------------------------------------------------------------
    // 2. Build prompt with optional conversation history.
    // -------------------------------------------------------------------------
    const history = getHistoryMessages(messages as Message[]);
    const promptText = buildPromptWithHistory(userText, history);

    // -------------------------------------------------------------------------
    // 3. Planner: decide the cheapest viable strategy.
    // -------------------------------------------------------------------------
    let plan;
    try {
      console.log(`${logPrefix} Planning...`);
      plan = await planWebSearches(promptText);
      console.log(`${logPrefix} Plan:`, JSON.stringify(plan, null, 2));
    } catch (err: unknown) {
      console.error(`${logPrefix} Planner failed:`, err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      const isRateLimit =
        (err as { status?: number }).status === 429 ||
        errorMessage.includes("Quota exceeded") ||
        errorMessage.includes("quota");

      await db.insert(message).values({
        id: assistantMessageId,
        chatId: activeChatId,
        role: "assistant",
        content: isRateLimit
          ? "Gemini API rate limit or daily quota exceeded. Please try again in a moment."
          : "Failed to plan response.",
        error: true,
      });

      return NextResponse.json(
        {
          error: isRateLimit
            ? "Gemini API rate limit or daily quota exceeded. Please try again in a moment."
            : "Failed to plan response.",
          chatId: activeChatId,
        },
        { status: isRateLimit ? 429 : 502 }
      );
    }

    // If the planner wants clarification, persist and stream the question back.
    if (plan.askForClarification) {
      console.log(`${logPrefix} Asking for clarification.`);
      await db.insert(message).values({
        id: assistantMessageId,
        chatId: activeChatId,
        role: "assistant",
        content: plan.askForClarification,
        error: false,
      });

      const clarificationStream = new ReadableStream({
        start(controller) {
          controller.enqueue(sseStatus("Thinking..."));
          controller.enqueue(sseContent(plan.askForClarification ?? ""));
          controller.close();
        },
      });
      return new Response(clarificationStream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "X-Chat-Id": activeChatId,
        },
      });
    }

    // If the planner can answer directly, persist and stream its answer.
    if (plan.strategy === "direct_answer") {
      console.log(`${logPrefix} Direct answer strategy. Streaming answer.`);
      const answer = plan.directAnswer ?? "I'm not sure how to answer that.";

      await db.insert(message).values({
        id: assistantMessageId,
        chatId: activeChatId,
        role: "assistant",
        content: answer,
        error: false,
      });

      const directStream = new ReadableStream({
        start(controller) {
          controller.enqueue(sseStatus("Generating Report..."));
          controller.enqueue(sseContent(answer));
          controller.close();
        },
      });
      return new Response(directStream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "X-Chat-Id": activeChatId,
        },
      });
    }

    // -------------------------------------------------------------------------
    // 4. Execute all planned searches in parallel through Tavily.
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

    // -------------------------------------------------------------------------
    // 5. Summarize search results if needed.
    // -------------------------------------------------------------------------

    if (allSearchesFailed(executedSearches)) {
      const failureDetails = executedSearches
        .map((s) => `  - "${s.query}": ${s.error}`)
        .join("\n");
      console.error(`${logPrefix} All web searches failed:\n${failureDetails}`);

      const errorContent =
        "All web searches failed. Please check your connection or try again in a moment.";
      await db.insert(message).values({
        id: assistantMessageId,
        chatId: activeChatId,
        role: "assistant",
        content: errorContent,
        error: true,
      });

      return NextResponse.json(
        { error: errorContent, chatId: activeChatId },
        { status: 502 }
      );
    }

    // -------------------------------------------------------------------------
    // 5. Decide whether to summarize or pipe raw results straight to the report.
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
    // 6. Stream the final report back to the client and persist it.
    // -------------------------------------------------------------------------
    let responseStream;
    try {
      if (summaries.length > 0 && !summaries.every((s) => s.error)) {
        console.log(`${logPrefix} Generating report from summaries...`);
        responseStream = await generateReportStream(promptText, plan, {
          summaries,
        });
      } else if (executedSearches.length > 0) {
        console.log(`${logPrefix} Generating report from raw search results...`);
        responseStream = await generateReportStream(promptText, plan, {
          rawResults: executedSearches,
        });
      } else {
        console.log(`${logPrefix} No searches planned; answering directly.`);
        responseStream = await withModelFallback(
          async (modelName) => {
            const chatSession = createChat(modelName);
            return chatSession.sendMessageStream({ message: promptText });
          },
          { label: "direct-answer" }
        );
      }
    } catch (err: unknown) {
      console.error(`${logPrefix} Final report stream call failed:`, err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      const isRateLimit =
        (err as { status?: number }).status === 429 ||
        errorMessage.includes("Quota exceeded") ||
        errorMessage.includes("quota");

      const errorContent = isRateLimit
        ? "Gemini API rate limit or daily quota exceeded. Please try again in a moment."
        : "Failed to connect to Gemini API.";

      await db.insert(message).values({
        id: assistantMessageId,
        chatId: activeChatId,
        role: "assistant",
        content: errorContent,
        error: true,
      });

      return NextResponse.json(
        { error: errorContent, chatId: activeChatId },
        { status: isRateLimit ? 429 : 502 }
      );
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

        await db.insert(message).values({
          id: assistantMessageId,
          chatId: activeChatId,
          role: "assistant",
          content: fullContent,
          error: false,
        });

        await db
          .update(chat)
          .set({ updatedAt: new Date() })
          .where(eq(chat.id, activeChatId));
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "X-Chat-Id": activeChatId,
      },
    });
  } catch (err) {
    console.error(`${logPrefix} Internal server error:`, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
