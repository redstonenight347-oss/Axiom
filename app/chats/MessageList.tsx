import type { RefObject } from "react";
import type { Message } from "./types";
import { MessageBubble } from "./MessageBubble";
import { WelcomeScreen } from "./WelcomeScreen";

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onSuggestionClick: (text: string) => void;
}

export function MessageList({
  messages,
  isTyping,
  messagesEndRef,
  onSuggestionClick,
}: MessageListProps) {
  const isEmpty = messages.length === 0;

  return (
    <main className="relative z-10 flex-1 overflow-y-auto px-4 md:px-0 scroll-smooth custom-scrollbar">
      <div className="mx-auto max-w-2xl py-6 flex flex-col gap-5">
        {/* Empty state */}
        {isEmpty && <WelcomeScreen onSuggestionClick={onSuggestionClick} />}

        {/* Message bubbles */}
        {messages.map((msg, i) => (
          <div
            key={msg.id}
            className="animate-message-in"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <MessageBubble
              message={msg}
              isTyping={isTyping}
              isLast={i === messages.length - 1}
            />
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>
    </main>
  );
}
