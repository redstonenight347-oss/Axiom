"use client";

import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const WELCOME_SUGGESTIONS = [
  "Explain quantum computing in simple terms",
  "Write a haiku about the ocean",
  "How does a neural network learn?",
];

export default function ChatsPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const   textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  /* Auto-resize textarea */
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    }
  }, [input]);

  const simulateAIResponse = (userMessage: string) => {
    setIsTyping(true);
    setTimeout(() => {
      const response: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `That's a great prompt! You said: "${userMessage}". I'm Axiom — once I'm connected to a real model, I'll give you a much better answer. 🚀`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, response]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
  };

  const handleSend = () => {
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
    simulateAIResponse(trimmed);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (text: string) => {
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
      simulateAIResponse(text);
    }, 150);
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* ──────────── Ambient background glow ──────────── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[15%] h-125 w-125 rounded-full bg-purple-600/15 blur-[140px]" />
        <div className="absolute bottom-[10%] right-[10%] h-100 w-100 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[60%] h-75 w-75 rounded-full bg-indigo-500/8 blur-[100px]" />
      </div>

      {/* ──────────── Header ──────────── */}
      <header className="relative z-10 flex items-center gap-3 px-6 py-4 border-b border-white/6 bg-white/2 backdrop-blur-md">
        <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-linear-to-br from-purple-500 to-cyan-400 shadow-lg shadow-purple-500/20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-white"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5Z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div> 
          <h1 className="text-[15px] font-semibold tracking-tight">Axiom</h1>
          <p className="text-[11px] text-white/40 leading-none mt-0.5">
            Advanced AI&ensp;·&ensp;Online
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] text-emerald-400/80 font-medium">
            Ready
          </span>
        </div>
      </header>

      {/* ──────────── Messages area ──────────── */}
      <main className="relative z-10 flex-1 overflow-y-auto px-4 md:px-0 scroll-smooth custom-scrollbar">
        <div className="mx-auto max-w-2xl py-6 flex flex-col gap-5">
          {/* Empty state */}
          {isEmpty && (
            <div className="flex flex-col items-center justify-center flex-1 py-24 animate-fade-in">
              {/* Logo orb */}
              <div className="relative mb-8">
                <div className="absolute inset-0 rounded-full bg-linear-to-br from-purple-500/30 to-cyan-400/30 blur-2xl scale-150 animate-pulse-slow" />
                <div className="relative flex items-center justify-center h-20 w-20 rounded-full g-linear-to-br from-purple-500/20 to-cyan-400/20 border border-white/8 backdrop-blur-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-9 w-9 text-purple-300/80"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5Z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-semibold bg-linear-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent mb-2">
                How can I help you today?
              </h2>
              <p className="text-sm text-white/35 mb-10 max-w-xs text-center">
                Ask me anything — I can reason, create, and explore ideas with
                you.
              </p>

              {/* Suggestion chips */}
              <div className="flex flex-wrap justify-center gap-2.5">
                {WELCOME_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestionClick(s)}
                    className="group relative px-4 py-2.5 rounded-2xl text-[13px] text-white/60 border border-white/[0.07] bg-white/3 backdrop-blur-sm hover:border-purple-400/30 hover:text-white/90 hover:bg-white/6 transition-all duration-300 cursor-pointer"
                  >
                    <span className="absolute inset-0 rounded-2xl bg-linear-to-r from-purple-500/0 to-cyan-400/0 group-hover:from-purple-500/5 group-hover:to-cyan-400/5 transition-all duration-300" />
                    <span className="relative">{s}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((msg, i) => (
            <div
              key={msg.id}
              className={`flex gap-3 animate-message-in ${
                msg.role === "user" ? "flex-row-reverse" : ""
              }`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {/* Avatar */}
              {msg.role === "assistant" && (
                <div className="shrink-0 mt-1">
                  <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-linear-to-br from-purple-500/20 to-cyan-400/20 border border-white/8">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-purple-300/80"
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5Z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Bubble */}
              <div
                className={`relative max-w-[80%] px-4 py-3 rounded-2xl text-[14px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-linear-to-br from-purple-600/80 to-indigo-600/80 text-white rounded-br-md shadow-lg shadow-purple-500/10"
                    : "bg-white/5 text-white/85 border border-white/6 rounded-bl-md backdrop-blur-sm"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <span
                  className={`block text-[10px] mt-2 ${
                    msg.role === "user" ? "text-white/40 text-right" : "text-white/25"
                  }`}
                >
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3 animate-message-in">
              <div className="shrink-0 mt-1">
                <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-linear-to-br from-purple-500/20 to-cyan-400/20 border border-white/8">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 text-purple-300/80"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5Z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
              </div>
              <div className="bg-white/5 border border-white/6 rounded-2xl rounded-bl-md px-5 py-4 backdrop-blur-sm">
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-purple-400/60 animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-purple-400/60 animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-purple-400/60 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ──────────── Input bar ──────────── */}
      <footer className="relative z-10 px-4 pb-5 pt-3">
        {/* Top fade */}
        <div className="pointer-events-none absolute -top-12 left-0 right-0 h-12 bg-linear-to-t from-[#0a0a0f] to-transparent" />

        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-2xl relative flex items-end gap-2 rounded-2xl border border-white/8 bg-white/4 backdrop-blur-xl p-2 shadow-2xl shadow-black/40 transition-all duration-300 focus-within:border-purple-500/30 focus-within:shadow-purple-500/5"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Axiom…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-[14px] text-white/90 placeholder:text-white/25 px-3 py-2.5 outline-none max-h-40 custom-scrollbar leading-relaxed"
          />

          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="shrink-0 flex items-center justify-center h-10 w-10 rounded-xl bg-linear-to-br from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/25 disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed hover:shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4.5 w-4.5"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </form>

        <p className="text-center text-[11px] text-white/20 mt-3">
          Axiom can make mistakes. Verify important information.
        </p>
      </footer>
    </div>
  );
}
