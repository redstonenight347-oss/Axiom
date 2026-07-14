import { MAX_HISTORY_MESSAGES } from "@/lib/ai/config";
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

export function buildPromptWithHistory(userText: string, messages: Message[]): string {
  const history = getHistoryMessages(messages);
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
