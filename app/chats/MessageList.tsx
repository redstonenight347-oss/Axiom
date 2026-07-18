"use client";

import { useEffect } from "react";
import { MessageBubble } from "./MessageBubble";
import { WelcomeScreen } from "@/components/ui/WelcomeScreen";
import { useChatStore } from "@/store/chatStore";

function ChatSkeleton() {
  return (
    <div className="flex flex-col gap-5 py-6 animate-pulse">
      <div className="flex flex-row-reverse gap-3">
        <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-br-md bg-white/10 space-y-2">
          <div className="h-4 w-48 bg-white/20 rounded" />
          <div className="h-4 w-32 bg-white/10 rounded" />
        </div>
      </div>
      <div className="flex gap-3">
        <div className="shrink-0 h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-white/10" />
        <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-md bg-white/5 space-y-2">
          <div className="h-4 w-64 bg-white/10 rounded" />
          <div className="h-4 w-52 bg-white/10 rounded" />
          <div className="h-4 w-40 bg-white/10 rounded" />
        </div>
      </div>
      <div className="flex flex-row-reverse gap-3">
        <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-br-md bg-white/10 space-y-2">
          <div className="h-4 w-56 bg-white/20 rounded" />
        </div>
      </div>
    </div>
  );
}

export function MessageList() {
  const messages = useChatStore((state) => state.messages);
  const isTyping = useChatStore((state) => state.isTyping);
  const isLoadingChat = useChatStore((state) => state.isLoadingChat);
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
        {isEmpty && (isLoadingChat ? <ChatSkeleton /> : <WelcomeScreen />)}

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
