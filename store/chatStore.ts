"use client";

import { create } from "zustand";
import type { RefObject } from "react";
import type { Message, AttachedDocument } from "@/app/chats/types";

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
  status: string | null;
  chatId: string | null;
  initialChatId: string | null;

  /* Sidebar state */
  chats: ChatListItem[];
  isLoadingChats: boolean;
  isLoadingChat: boolean;
  isMobileSidebarOpen: boolean;

  /* Attached documents */
  attachedDocuments: AttachedDocument[];
  isUploading: boolean;
  uploadError: string | null;

  /* Refs (mutable, not part of React reactivity) */
  messagesEndRef: RefObject<HTMLDivElement | null>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;

  /* Actions */
  setInput: (value: string) => void;
  setChatId: (id: string | null | undefined) => void;
  setInitialChatId: (id: string | null | undefined) => void;
  setIsMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  setStatus: (status: string | null) => void;

  loadChats: () => Promise<void>;
  loadChat: (id: string) => Promise<void>;

  sendMessage: (text?: string) => void;
  handleSuggestionClick: (text: string) => void;
  startNewChat: () => void;
  selectChat: (id: string) => void;
  deleteChat: (id: string) => Promise<void>;

  /* Document upload actions */
  uploadDocuments: (files: File[]) => Promise<void>;
  removeAttachedDocument: (id: string) => void;
  clearAttachedDocuments: () => void;

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
  status: null,
  chatId: null,
  initialChatId: null,
  chats: [],
  isLoadingChats: false,
  isLoadingChat: false,
  isMobileSidebarOpen: false,
  attachedDocuments: [],
  isUploading: false,
  uploadError: null,
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
  setStatus: (status) => set({ status }),

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
    set({ isLoadingChat: true });
    try {
      const res = await fetch(`/api/chats/${id}`);
      if (!res.ok) {
        set({ messages: [] });
        return;
      }
      const data = await res.json();

      const documentsByMessageId = new Map<string, AttachedDocument[]>();
      for (const doc of data.documents ?? []) {
        if (doc.messageId) {
          const list = documentsByMessageId.get(doc.messageId) ?? [];
          list.push({
            id: doc.id,
            name: doc.name,
            totalPages: doc.totalPages,
            chunkCount: doc.chunkCount,
          });
          documentsByMessageId.set(doc.messageId, list);
        }
      }

      const loadedMessages: Message[] = (data.messages ?? []).map(
        (msg: Message & { timestamp: string }) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
          documents: documentsByMessageId.get(msg.id),
        })
      );
      set({ messages: loadedMessages });
    } catch (err) {
      console.error("Failed to load chat:", err);
      set({ messages: [] });
    } finally {
      set({ isLoadingChat: false });
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
      documents: state.attachedDocuments.length > 0 ? [...state.attachedDocuments] : undefined,
    };

    set((prev) => ({
      messages: [...prev.messages, userMsg],
      input: "",
      attachedDocuments: [],
      isTyping: true,
      status: "Thinking...",
    }));

    const ta = state.textareaRef.current;
    if (ta) {
      ta.value = "";
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
        const documentIds = get().attachedDocuments.map((doc) => doc.id);

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId: currentChatId,
            userText: trimmed,
            messages: currentMessages,
            documentIds,
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
            status: null,
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
            status: null,
          }));
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let streamedContent = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse complete SSE messages (double-newline terminated).
          while (true) {
            const separatorIndex = buffer.indexOf("\n\n");
            if (separatorIndex === -1) break;

            const rawMessage = buffer.slice(0, separatorIndex);
            buffer = buffer.slice(separatorIndex + 2);

            const lines = rawMessage.split("\n");
            let eventType: string | null = null;
            let dataValue: string | null = null;

            for (const line of lines) {
              if (line.startsWith("event:")) {
                eventType = line.slice(6).trim();
              } else if (line.startsWith("data:")) {
                dataValue = line.slice(5).trim();
              }
            }

            if (eventType === "status" && dataValue) {
              set({ status: dataValue });
            } else if (eventType === "content" && dataValue) {
              try {
                const parsed = JSON.parse(dataValue);
                if (typeof parsed === "string") {
                  streamedContent += parsed;
                }
              } catch {
                // Plain-text fallback: treat non-JSON data as raw content.
                streamedContent += dataValue;
              }
              set((prev) => ({
                messages: prev.messages.map((msg) =>
                  msg.id === assistantId ? { ...msg, content: streamedContent } : msg
                ),
              }));
            } else if (dataValue) {
              // Unknown event or no event line: treat as plain content fallback.
              streamedContent += dataValue;
              set((prev) => ({
                messages: prev.messages.map((msg) =>
                  msg.id === assistantId ? { ...msg, content: streamedContent } : msg
                ),
              }));
            }
          }
        }

        const finalChunk = decoder.decode();
        if (finalChunk) {
          // Process any remaining buffered SSE data on stream end.
          buffer += finalChunk;
          while (true) {
            const separatorIndex = buffer.indexOf("\n\n");
            if (separatorIndex === -1) break;

            const rawMessage = buffer.slice(0, separatorIndex);
            buffer = buffer.slice(separatorIndex + 2);

            const lines = rawMessage.split("\n");
            let eventType: string | null = null;
            let dataValue: string | null = null;

            for (const line of lines) {
              if (line.startsWith("event:")) {
                eventType = line.slice(6).trim();
              } else if (line.startsWith("data:")) {
                dataValue = line.slice(5).trim();
              }
            }

            if (eventType === "status" && dataValue) {
              set({ status: dataValue });
            } else if (eventType === "content" && dataValue) {
              try {
                const parsed = JSON.parse(dataValue);
                if (typeof parsed === "string") {
                  streamedContent += parsed;
                }
              } catch {
                streamedContent += dataValue;
              }
              set((prev) => ({
                messages: prev.messages.map((msg) =>
                  msg.id === assistantId ? { ...msg, content: streamedContent } : msg
                ),
              }));
            } else if (dataValue) {
              streamedContent += dataValue;
              set((prev) => ({
                messages: prev.messages.map((msg) =>
                  msg.id === assistantId ? { ...msg, content: streamedContent } : msg
                ),
              }));
            }
          }
        }

        set({ isTyping: false, status: null });
      } catch (err) {
        console.log(err);
        set((prev) => ({
          messages: prev.messages.map((msg) =>
            msg.id === assistantId ? { ...msg, error: true } : msg
          ),
          isTyping: false,
          status: null,
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
    set({ chatId: null, messages: [], input: "", status: null, isLoadingChat: false, isMobileSidebarOpen: false });
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

  uploadDocuments: async (files) => {
    const state = get();
    const maxSizeMb = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB ?? "10");
    const maxSizeBytes = maxSizeMb * 1024 * 1024;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    if (totalSize > maxSizeBytes) {
      set({ uploadError: `Total upload size exceeds ${maxSizeMb} MB limit` });
      return;
    }

    set({ isUploading: true, uploadError: null });

    try {
      const formData = new FormData();
      formData.append("chatId", state.chatId ?? "");
      files.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/upload/pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Upload failed" }));
        set({ uploadError: data.error ?? "Upload failed" });
        return;
      }

      const data = await res.json();
      const uploaded: AttachedDocument[] = data.documents ?? [];

      if (data.chatId && data.chatId !== get().chatId) {
        get().setChatId(data.chatId);
      }

      set((prev) => ({
        attachedDocuments: [...prev.attachedDocuments, ...uploaded],
      }));
    } catch (err) {
      console.error("Failed to upload documents:", err);
      set({ uploadError: "Failed to upload documents" });
    } finally {
      set({ isUploading: false });
    }
  },

  removeAttachedDocument: (id) => {
    set((prev) => ({
      attachedDocuments: prev.attachedDocuments.filter((doc) => doc.id !== id),
    }));
  },

  clearAttachedDocuments: () => {
    set({ attachedDocuments: [], uploadError: null });
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
