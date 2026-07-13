"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { SubmitEvent, KeyboardEvent } from "react";
import type { Message } from "./types";

interface ChatListItem {
  id: string;
  title: string;
  updatedAt: string;
}

interface UseChatOptions {
  initialChatId?: string | null;
}

export function useChat({ initialChatId }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatId, setChatId] = useState<string | null>(initialChatId ?? null);

  const setChatIdSafe = useCallback((id: string | null | undefined) => {
    setChatId(id ?? null);
  }, []);

  // Keep local chatId in sync when the URL-driven initialChatId changes.
  useEffect(() => {
    setChatIdSafe(initialChatId);
    // setChatIdSafe is a stable callback wrapper around setChatId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialChatId]);
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  /* Auto-resize textarea */
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    }
  }, [input]);

  /* Load chat list */
  const loadChats = useCallback(async () => {
    setIsLoadingChats(true);
    try {
      const res = await fetch("/api/chats");
      if (!res.ok) return;
      const data = await res.json();
      setChats(data.chats ?? []);
    } catch (err) {
      console.error("Failed to load chats:", err);
    } finally {
      setIsLoadingChats(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadChats().then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [loadChats]);

  /* Load existing chat messages */
  useEffect(() => {
    if (!initialChatId) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    async function loadChat() {
      try {
        const res = await fetch(`/api/chats/${initialChatId}`);
        if (cancelled) return;
        if (!res.ok) {
          setMessages([]);
          return;
        }
        const data = await res.json();
        const loadedMessages: Message[] = (data.messages ?? []).map(
          (msg: Message & { timestamp: string }) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })
        );
        setMessages(loadedMessages);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load chat:", err);
        setMessages([]);
      }
    }

    loadChat();
    return () => {
      cancelled = true;
    };
  }, [initialChatId]);

  const AIResponse = useCallback(
    async (userMessage: string) => {
      setIsTyping(true);

      const assistantId = crypto.randomUUID();
      const assistantMsg: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId,
            userText: userMessage,
            messages,
          }),
        });

        const returnedChatId = res.headers.get("X-Chat-Id");
        if (returnedChatId && returnedChatId !== chatId) {
          setChatIdSafe(returnedChatId);
          // Refresh the chat list so the new chat appears.
          loadChats();
        }

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: errorData.error ?? "Something went wrong", error: true }
                : msg
            )
          );
          return;
        }

        if (!res.body) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: "No response stream available", error: true }
                : msg
            )
          );
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
console.log(streamedContent)
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: streamedContent }
                : msg
            )
          );
        }

        // Flush any remaining bytes in the decoder.
        const finalChunk = decoder.decode();
        if (finalChunk) {
          streamedContent += finalChunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: streamedContent }
                : msg
            )
          );
        }
      } catch (err) {
        console.log(err);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, error: true }
              : msg
          )
        );
      } finally {
        setIsTyping(false);
      }
    },
    // setChatIdSafe is a stable callback wrapper around setChatId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chatId, messages, loadChats]
  );

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    AIResponse(trimmed);
  }, [input, isTyping, AIResponse]);

  const handleSubmit = useCallback(
    (e: SubmitEvent) => {
      e.preventDefault();
      handleSend();
    },
    [handleSend]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleSuggestionClick = useCallback(
    (text: string) => {
      setInput(text);
      /* Small delay so the user sees it fill in, then send */
      setTimeout(() => {
        const userMsg: Message = {
          id: crypto.randomUUID(),
          role: "user",
          content: text,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        AIResponse(text);
      }, 150);
    },
    [AIResponse]
  );

  const startNewChat = useCallback(() => {
    setChatIdSafe(null);
    setMessages([]);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [setChatIdSafe]);

  const selectChat = useCallback((id: string) => {
    // Navigation is handled by the page component via router.push.
    // This hook just keeps local state in sync when initialChatId changes.
    setChatIdSafe(id);
  }, [setChatIdSafe]);

  const deleteChat = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/chats?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        if (!res.ok) return;
        setChats((prev) => prev.filter((c) => c.id !== id));
        if (chatId === id) {
          setChatIdSafe(null);
          setMessages([]);
          setInput("");
        }
      } catch (err) {
        console.error("Failed to delete chat:", err);
      }
    },
    [chatId, setChatIdSafe]
  );

  return {
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
    selectChat,
    deleteChat,
  };
}
