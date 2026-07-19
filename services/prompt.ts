import { MAX_HISTORY_MESSAGES } from "@/lib/ai/constants";
import type { Message } from "@/app/chats/types";

export function truncateTitle(text: string, maxLength = 60): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength).trimEnd() + "…";
}

export function getHistoryMessages(messages: Message[]): Message[] {
  if (MAX_HISTORY_MESSAGES <= 0) return [];
  return messages.slice(-MAX_HISTORY_MESSAGES);
}

function buildSystemInstruction(customPrompt?: string | null): string[] {
  if (!customPrompt?.trim()) return [];
  return ["=== System instructions ===", customPrompt.trim(), ""];
}

export function buildPromptWithHistory(
  userText: string,
  messages: Message[],
  customPrompt?: string | null
): string {
  const history = getHistoryMessages(messages);
  if (history.length === 0) {
    const system = buildSystemInstruction(customPrompt);
    return [...system, userText].join("\n").trim();
  }

  const historyText = history
    .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
    .join("\n\n");

  return [
    ...buildSystemInstruction(customPrompt),
    "Continue the following conversation. Use the prior messages as context when answering.",
    "",
    "=== Conversation history ===",
    historyText,
    "",
    "=== Latest user message ===",
    userText,
  ].join("\n").trim();
}

export interface RetrievedChunk {
  content: string;
  documentName?: string;
}

export function buildPromptWithRetrievedChunks(
  userText: string,
  messages: Message[],
  chunks: RetrievedChunk[],
  customPrompt?: string | null
): string {
  const history = getHistoryMessages(messages);
  const historyText = history.length
    ? history
        .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n\n")
    : "No prior conversation.";

  const contextBlocks = chunks
    .map((chunk, index) => {
      const source = chunk.documentName ? ` [Source: ${chunk.documentName}]` : "";
      return `[Excerpt ${index + 1}]${source}\n${chunk.content}`;
    })
    .join("\n\n");

  return [
    ...buildSystemInstruction(customPrompt),
    "You are a helpful assistant answering questions based on uploaded documents.",
    "Use ONLY the provided document excerpts to answer the user's question.",
    "If the excerpts do not contain enough information, say so clearly.",
    "Do not introduce information that is not supported by the excerpts.",
    "Cite the source document when possible.",
    "",
    "=== Document excerpts ===",
    contextBlocks || "No relevant excerpts found.",
    "",
    "=== Conversation history ===",
    historyText,
    "",
    "=== Latest user message ===",
    userText,
  ].join("\n").trim();
}
