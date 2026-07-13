"use client";

import { useEffect } from "react";
import { MessageBubble } from "./MessageBubble";
import { WelcomeScreen } from "@/components/ui/WelcomeScreen";
import { useChatStore } from "@/store/chatStore";

export function MessageList() {
  const messages = useChatStore((state) => state.messages);
  const isTyping = useChatStore((state) => state.isTyping);
  const status = useChatStore((state) => state.status);
  const messagesEndRef = useChatStore((state) => state.messagesEndRef);

  const isEmpty = messages.length === 0;

  /* Scroll to bottom when messages or typing state changes */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, messagesEndRef]);

  return (
    <main className="relative z-10 flex-1 overflow-y-auto px-4 md:px-0 scroll-smooth custom-scrollbar">
      <div className="mx-auto max-w-2xl py-6 flex flex-col gap-5">
        {/* Empty state */}
        {isEmpty && <WelcomeScreen />}

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
              status={i === messages.length - 1 ? status : null}
            />
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>
    </main>
  );
}
