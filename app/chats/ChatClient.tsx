"use client";

import { useEffect } from "react";
import { useChatStore } from "@/store/chatStore";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { ChatHeader } from "@/components/ui/ChatHeader";
import { MessageList } from "./MessageList";
import { ChatInput } from "@/components/ui/ChatInput";
import { ChatSidebar } from "@/components/ChatSidebar";

interface ChatClientProps {
  initialChatId?: string | null;
}

export function ChatClient({ initialChatId }: ChatClientProps) {
  const setInitialChatId = useChatStore((state) => state.setInitialChatId);
  const loadChats = useChatStore((state) => state.loadChats);
  const loadChat = useChatStore((state) => state.loadChat);
  const isMobileSidebarOpen = useChatStore((state) => state.isMobileSidebarOpen);
  const setIsMobileSidebarOpen = useChatStore((state) => state.setIsMobileSidebarOpen);
  const chatId = useChatStore((state) => state.chatId);

  /* Sync store with URL-driven initialChatId */
  useEffect(() => {
    setInitialChatId(initialChatId);
  }, [initialChatId, setInitialChatId]);

  /* Load chat list once on mount */
  useEffect(() => {
    let cancelled = false;
    loadChats().then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [loadChats]);

  /* Load existing chat messages when chatId changes */
  useEffect(() => {
    if (!chatId) {
      return;
    }

    let cancelled = false;
    loadChat(chatId).then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [chatId, loadChat]);

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-white overflow-hidden">
      <AmbientBackground />

      {/* Desktop sidebar */}
      <div className="hidden md:block shrink-0">
        <ChatSidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">
            <ChatSidebar />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0 relative">
        <ChatHeader />
        <MessageList />
        <ChatInput />
      </div>
    </div>
  );
}
