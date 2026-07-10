"use client";

import { useChat } from "./useChat";
import { AmbientBackground } from "./AmbientBackground";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { ChatSidebar } from "./ChatSidebar";

interface ChatClientProps {
  initialChatId?: string | null;
}

export function ChatClient({ initialChatId }: ChatClientProps) {
  const {
    messages,
    input,
    setInput,
    isTyping,
    chatId,
    chats,
    isLoadingChats,
    messagesEndRef,
    textareaRef,
    handleSubmit,
    handleKeyDown,
    handleSuggestionClick,
    startNewChat,
    deleteChat,
  } = useChat({ initialChatId });

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-white overflow-hidden">
      <AmbientBackground />

      <ChatSidebar
        chats={chats}
        activeChatId={chatId}
        isLoading={isLoadingChats}
        onNewChat={startNewChat}
        onDeleteChat={deleteChat}
      />

      <div className="flex-1 flex flex-col min-w-0 relative">
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
    </div>
  );
}
