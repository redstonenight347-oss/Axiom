import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from "@/lib/rate-limit";
import { rateLimits } from "@/lib/rate-limit-config";
import {
  resolveChatSession,
  persistUserMessage,
  ChatNotFoundError,
} from "@/services/chat-session";
import { buildPromptWithHistory, buildPromptWithRetrievedChunks } from "@/services/prompt";
import { runChatPipeline } from "@/services/chat-pipeline";
import { retrieveRelevantChunks } from "@/lib/ai/retrieval";
import { db } from "@/lib/db";
import { document } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { Message } from "@/app/chats/types";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const rateLimit = checkRateLimit({
    key: `${getClientIdentifier(req, userId)}:${rateLimits.chat.name}`,
    limit: rateLimits.chat.limit,
    windowMs: rateLimits.chat.windowMs,
  });
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }
  const body = await req.json().catch(() => ({}));
  const { chatId, userText, messages = [], documentIds = [] } = body;

  if (!userText || typeof userText !== "string") {
    return NextResponse.json({ error: "Missing userText" }, { status: 400 });
  }

  const requestId = crypto.randomUUID();
  const logPrefix = `[Chat API ${requestId}]`;

  try {
    const { activeChatId, assistantMessageId } = await resolveChatSession({
      userId,
      chatId,
      userText,
    });

    await persistUserMessage({ chatId: activeChatId, content: userText });

    const hasDocuments = Array.isArray(documentIds) && documentIds.length > 0;
    let promptText: string;

    if (hasDocuments) {
      const chunks = await retrieveRelevantChunks({
        chatId: activeChatId,
        query: userText,
        topK: 5,
        documentIds,
      });

      console.log(`${logPrefix} Retrieved ${chunks.length} chunks for documentIds:`, documentIds);

      const documentMap = await db.query.document.findMany({
        where: eq(document.chatId, activeChatId),
        columns: { id: true, name: true },
      });
      const nameById = new Map(documentMap.map((d) => [d.id, d.name]));

      promptText = buildPromptWithRetrievedChunks(
        userText,
        messages as Message[],
        chunks.map((chunk) => ({
          content: chunk.content,
          documentName: nameById.get(chunk.documentId),
        }))
      );
    } else {
      promptText = buildPromptWithHistory(userText, messages as Message[]);
    }

    const result = await runChatPipeline({
      requestId,
      activeChatId,
      assistantMessageId,
      userText,
      promptText,
      hasDocuments,
    });

    if (result.type === "error") {
      return NextResponse.json(
        { error: result.error, chatId: activeChatId },
        { status: result.status }
      );
    }

    return new Response(result.stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "X-Chat-Id": activeChatId,
      },
    });
  } catch (err) {
    if (err instanceof ChatNotFoundError) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    console.error(`${logPrefix} Internal server error:`, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
