import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from "@/lib/rate-limit";
import { rateLimits } from "@/lib/rate-limit-config";
import { db } from "@/lib/db";
import { chat, message, document } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const rateLimit = checkRateLimit({
    key: `${getClientIdentifier(req, userId)}:${rateLimits.chats.name}`,
    limit: rateLimits.chats.limit,
    windowMs: rateLimits.chats.windowMs,
  });
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }
  const { id } = await params;

  const existingChat = await db.query.chat.findFirst({
    where: and(eq(chat.id, id), eq(chat.userId, userId)),
  });

  if (!existingChat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const messages = await db.query.message.findMany({
    where: eq(message.chatId, id),
    orderBy: [asc(message.createdAt)],
  });

  const documents = await db.query.document.findMany({
    where: eq(document.chatId, id),
    columns: { id: true, messageId: true, name: true, totalPages: true },
    with: {
      chunks: {
        columns: { id: true },
      },
    },
  });

  return NextResponse.json({
    chat: existingChat,
    messages: messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      error: msg.error,
      timestamp: msg.createdAt,
    })),
    documents: documents.map((doc) => ({
      id: doc.id,
      messageId: doc.messageId,
      name: doc.name,
      totalPages: doc.totalPages,
      chunkCount: doc.chunks?.length ?? 0,
    })),
  });
}
