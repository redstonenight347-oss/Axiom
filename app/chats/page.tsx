"use client";

import { useChat } from "./useChat";
import { AmbientBackground } from "./AmbientBackground";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

export default function ChatsPage() {
  const {
    messages,
    input,
    setInput,
    isTyping,
    messagesEndRef,
    textareaRef,
    handleSubmit,
    handleKeyDown,
    handleSuggestionClick,
  } = useChat();

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] text-white overflow-hidden">
      <AmbientBackground />
      <ChatHeader />
      <MessageList
        messages={messages}
        isTyping={isTyping}
        messagesEndRef={messagesEndRef}
        onSuggestionClick={handleSuggestionClick}
      />
      <ChatInput
        input={input}
        isTyping={isTyping}
        textareaRef={textareaRef}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
