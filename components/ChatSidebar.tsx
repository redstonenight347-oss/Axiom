"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useChatStore } from "@/store/chatStore";
import Image from "next/image";
import { authClient } from "@/lib/auth/client";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ChatSidebar() {
  const router = useRouter();
  const chats = useChatStore((state) => state.chats);
  const activeChatId = useChatStore((state) => state.chatId);
  const isLoading = useChatStore((state) => state.isLoadingChats);
  const isLoadingChat = useChatStore((state) => state.isLoadingChat);
  const startNewChat = useChatStore((state) => state.startNewChat);
  const deleteChat = useChatStore((state) => state.deleteChat);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/auth");
    router.refresh();
  };

  return (
    <aside className="flex flex-col h-full py-md px-sm gap-y-sm bg-surface-container-lowest/3 backdrop-blur-3xl border-r border-outline-variant/20 w-82 shrink-0 transition-all">
      {/* Header/Logo Area */}
      <div className="flex items-center gap-sm px-xs mb-md mt-2">
        <img  
          alt="Axiom AI"
          className="w-24 h-22 rounded-lg shadow-lg"
          src="/axiom_logo.png"
        />
        <div className="flex flex-col">
          <span className="text-headline-md font-headline-md font-black text-on-surface tracking-tight">Axiom AI</span>
          <span className="text-label-sm font-label-sm text-on-surface opacity-60">Deep Glass RAG</span>
        </div>
      </div>

      {/* New Chat CTA */}
      <button
        onClick={startNewChat}
        className="flex items-center justify-center gap-xs w-full py-sm px-md rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-all active:scale-95 mb-base shadow-lg shadow-primary/20 cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="font-bold text-body-md">New Chat</span>
      </button>

      {/* Navigation Tabs / Chat History */}
      <nav className="flex-1 flex flex-col gap-y-base overflow-y-auto custom-scrollbar pr-1">
        {isLoading ? (
          <div className="space-y-2 mt-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-lg bg-surface-variant/30 animate-pulse"
              />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <p className="text-label-sm text-on-surface-variant/50 text-center py-8 leading-relaxed">
            No chats yet. Start a new conversation.
          </p>
        ) : (
          <ul className="space-y-1 mt-2">
            {chats.map((item) => {
              const isActive = item.id === activeChatId;
              return (
                <li key={item.id}>
                  <div
                    className={`group flex items-center justify-between px-md py-sm rounded-lg transition-all duration-200 ${isActive
                        ? "bg-white/10 text-primary border-l-2 border-primary translate-x-1"
                        : isLoadingChat
                          ? "text-on-surface-variant opacity-40 cursor-not-allowed border-l-2 border-transparent"
                          : "text-on-surface-variant opacity-70 hover:bg-surface-variant/20 border-l-2 border-transparent cursor-pointer"
                      }`}
                    onClick={() => {
                      if (isLoadingChat || isActive) return;
                      router.push(`/chats?id=${encodeURIComponent(item.id)}`);
                    }}
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-sm text-label-sm truncate block">{item.title}</span>
                        <span className="text-[10px] opacity-60 truncate block">{formatDate(item.updatedAt)}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setChatToDelete(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-on-surface-variant hover:text-error hover:bg-error/10 transition-all duration-200 ml-2"
                      aria-label="Delete chat"
                      title="Delete chat"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      {chatToDelete &&
        createPortal(
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setChatToDelete(null)}
            />
            <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-white/10 bg-surface-container-low/95 backdrop-blur-xl p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-on-surface mb-2">
                Delete chat?
              </h3>
              <p className="text-sm text-on-surface-variant mb-6">
                This action cannot be undone. The chat and all its messages will be permanently removed.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setChatToDelete(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteChat(chatToDelete);
                    setChatToDelete(null);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-error text-on-error hover:bg-error/90 transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Footer Tabs */}
      <div className="mt-auto flex flex-col gap-y-base pt-md border-t border-outline-variant/20">
        <button onClick={handleSignOut} className="flex items-center gap-sm px-md py-xs rounded-lg text-on-surface-variant opacity-70 hover:bg-surface-variant/20 transition-all w-full text-left cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="font-label-sm text-label-sm">Log Out</span>
        </button>
      </div>
    </aside>
  );
}
