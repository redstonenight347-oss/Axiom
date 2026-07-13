"use client";

import { useState } from "react";
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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

  const handleNewChat = () => {
    setIsMobileSidebarOpen(false);
    startNewChat();
  };

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-white overflow-hidden">
      <AmbientBackground />

      {/* Desktop sidebar */}
      <div className="hidden md:block shrink-0">
        <ChatSidebar
          chats={chats}
          activeChatId={chatId}
          isLoading={isLoadingChats}
          onNewChat={startNewChat}
          onDeleteChat={deleteChat}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">
            <ChatSidebar
              chats={chats}
              activeChatId={chatId}
              isLoading={isLoadingChats}
              onNewChat={handleNewChat}
              onDeleteChat={deleteChat}
            />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0 relative">
        <ChatHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />
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
