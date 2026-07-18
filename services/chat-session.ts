import { db } from "@/lib/db";
import { chat, message, document } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { truncateTitle } from "./prompt";

export interface ResolveChatSessionInput {
  userId: string;
  chatId?: string;
  userText: string;
}

export interface ResolvedChatSession {
  activeChatId: string;
  assistantMessageId: string;
}

export async function resolveChatSession({
  userId,
  chatId,
  userText,
}: ResolveChatSessionInput): Promise<ResolvedChatSession> {
  let activeChatId = chatId;

  if (activeChatId) {
    const existingChat = await db.query.chat.findFirst({
      where: and(eq(chat.id, activeChatId), eq(chat.userId, userId)),
    });
    if (!existingChat) {
      throw new ChatNotFoundError();
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

  return {
    activeChatId,
    assistantMessageId: crypto.randomUUID(),
  };
}

export interface PersistUserMessageInput {
  chatId: string;
  content: string;
}

export async function persistUserMessage({
  chatId,
  content,
}: PersistUserMessageInput): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(message).values({
    id,
    chatId,
    role: "user",
    content,
    error: false,
  });
  return id;
}

export interface LinkDocumentsToMessageInput {
  messageId: string;
  documentIds: string[];
}

export async function linkDocumentsToMessage({
  messageId,
  documentIds,
}: LinkDocumentsToMessageInput): Promise<void> {
  if (documentIds.length === 0) return;
  await db
    .update(document)
    .set({ messageId })
    .where(and(inArray(document.id, documentIds)));
}

export interface PersistAssistantMessageInput {
  id: string;
  chatId: string;
  content: string;
  error: boolean;
}

export async function persistAssistantMessage({
  id,
  chatId,
  content,
  error,
}: PersistAssistantMessageInput): Promise<void> {
  await db.insert(message).values({
    id,
    chatId,
    role: "assistant",
    content,
    error,
  });
}

export async function touchChat(chatId: string): Promise<void> {
  await db.update(chat).set({ updatedAt: new Date() }).where(eq(chat.id, chatId));
}

export class ChatNotFoundError extends Error {
  constructor() {
    super("Chat not found");
  }
}
