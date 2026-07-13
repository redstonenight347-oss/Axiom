"use client";

import { create } from "zustand";
import type { RefObject } from "react";
import type { Message } from "./types";

export interface ChatListItem {
  id: string;
  title: string;
  updatedAt: string;
}

interface ChatState {
  /* Core chat state */
  messages: Message[];
  input: string;
  isTyping: boolean;
  chatId: string | null;
  initialChatId: string | null;

  /* Sidebar state */
  chats: ChatListItem[];
  isLoadingChats: boolean;
  isMobileSidebarOpen: boolean;

  /* Refs (mutable, not part of React reactivity) */
  messagesEndRef: RefObject<HTMLDivElement | null>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;

  /* Actions */
  setInput: (value: string) => void;
  setChatId: (id: string | null | undefined) => void;
  setInitialChatId: (id: string | null | undefined) => void;
  setIsMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;

  loadChats: () => Promise<void>;
  loadChat: (id: string) => Promise<void>;

  sendMessage: (text?: string) => void;
  handleSuggestionClick: (text: string) => void;
  startNewChat: () => void;
  selectChat: (id: string) => void;
  deleteChat: (id: string) => Promise<void>;

  /* Form/keyboard helpers */
  handleSubmit: (e: { preventDefault: () => void }) => void;
  handleKeyDown: (e: { key: string; shiftKey: boolean; preventDefault: () => void }) => void;
}

function createRef<T>(): RefObject<T | null> {
  return { current: null };
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  input: "",
  isTyping: false,
  chatId: null,
  initialChatId: null,
  chats: [],
  isLoadingChats: false,
  isMobileSidebarOpen: false,
  messagesEndRef: createRef<HTMLDivElement>(),
  textareaRef: createRef<HTMLTextAreaElement>(),

  setInput: (value) => {
    set({ input: value });

    /* Auto-resize textarea */
    const ta = get().textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    }
  },

  setChatId: (id) => set({ chatId: id ?? null }),

  setInitialChatId: (id) => {
    const safeId = id ?? null;
    set({ initialChatId: safeId, chatId: safeId });
  },

  setIsMobileSidebarOpen: (open) => set({ isMobileSidebarOpen: open }),
  toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),

  loadChats: async () => {
    set({ isLoadingChats: true });
    try {
      const res = await fetch("/api/chats");
      if (!res.ok) return;
      const data = await res.json();
      set({ chats: data.chats ?? [] });
    } catch (err) {
      console.error("Failed to load chats:", err);
    } finally {
      set({ isLoadingChats: false });
    }
  },

  loadChat: async (id) => {
    try {
      const res = await fetch(`/api/chats/${id}`);
      if (!res.ok) {
        set({ messages: [] });
        return;
      }
      const data = await res.json();
      const loadedMessages: Message[] = (data.messages ?? []).map(
        (msg: Message & { timestamp: string }) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })
      );
      set({ messages: loadedMessages });
    } catch (err) {
      console.error("Failed to load chat:", err);
      set({ messages: [] });
    }
  },

  sendMessage: (text) => {
    const state = get();
    const content = text ?? state.input;
    const trimmed = content.trim();
    if (!trimmed || state.isTyping) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    set((prev) => ({
      messages: [...prev.messages, userMsg],
      input: "",
      isTyping: true,
    }));

    const ta = state.textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
    }

    const currentMessages = [...state.messages, userMsg];
    const currentChatId = get().chatId;

    const assistantId = crypto.randomUUID();
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    set((prev) => ({ messages: [...prev.messages, assistantMsg] }));

    (async () => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId: currentChatId,
            userText: trimmed,
            messages: currentMessages,
          }),
        });

        const returnedChatId = res.headers.get("X-Chat-Id");
        if (returnedChatId && returnedChatId !== get().chatId) {
          get().setChatId(returnedChatId);
          get().loadChats();
        }

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
          set((prev) => ({
            messages: prev.messages.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: errorData.error ?? "Something went wrong", error: true }
                : msg
            ),
            isTyping: false,
          }));
          return;
        }

        if (!res.body) {
          set((prev) => ({
            messages: prev.messages.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: "No response stream available", error: true }
                : msg
            ),
            isTyping: false,
          }));
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let streamedContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          streamedContent += chunk;

          set((prev) => ({
            messages: prev.messages.map((msg) =>
              msg.id === assistantId ? { ...msg, content: streamedContent } : msg
            ),
          }));
        }

        const finalChunk = decoder.decode();
        if (finalChunk) {
          streamedContent += finalChunk;
          set((prev) => ({
            messages: prev.messages.map((msg) =>
              msg.id === assistantId ? { ...msg, content: streamedContent } : msg
            ),
          }));
        }

        set({ isTyping: false });
      } catch (err) {
        console.log(err);
        set((prev) => ({
          messages: prev.messages.map((msg) =>
            msg.id === assistantId ? { ...msg, error: true } : msg
          ),
          isTyping: false,
        }));
      }
    })();
  },

  handleSuggestionClick: (text) => {
    get().setInput(text);
    setTimeout(() => {
      get().sendMessage(text);
    }, 150);
  },

  startNewChat: () => {
    set({ chatId: null, messages: [], input: "", isMobileSidebarOpen: false });
    const ta = get().textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
    }
  },

  selectChat: (id) => {
    set({ chatId: id });
  },

  deleteChat: async (id) => {
    try {
      const res = await fetch(`/api/chats?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) return;
      set((prev) => ({ chats: prev.chats.filter((c) => c.id !== id) }));
      if (get().chatId === id) {
        get().startNewChat();
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  },

  handleSubmit: (e) => {
    e.preventDefault();
    get().sendMessage();
  },

  handleKeyDown: (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      get().sendMessage();
    }
  },
}));
