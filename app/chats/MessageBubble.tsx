"use client";

import { useState, useCallback } from "react";
import { AxiomIcon } from "@/components/ui/AxiomIcon";
import { Markdown } from "./Markdown";
import type { Message, AttachedDocument } from "./types";

interface MessageBubbleProps {
  message: Message;
  isTyping: boolean;
  isLast: boolean;
  status?: string | null;
}

function PdfBadge({ doc }: { doc: AttachedDocument }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-md border border-red-400/30 bg-red-500/10 px-2 py-1 text-xs sm:text-sm">
      <span className="font-bold text-red-400">PDF</span>
      <span className="truncate max-w-[12rem] sm:max-w-[16rem] text-white/80" title={doc.name}>
        {doc.name}
      </span>
    </div>
  );
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function CopyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CopyMessageButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard errors.
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="flex items-center justify-center p-1.5 rounded-md text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
      aria-label={copied ? "Copied message" : "Copy message"}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
}

export function MessageBubble({ message, isTyping, isLast, status }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const showTypingDots = isAssistant && !message.content && isTyping;
  const hideTimestamp = isAssistant && isTyping && isLast;
  const showPulseCursor = isAssistant && isTyping && isLast && !!message.content;
  const isFinishedAssistant = isAssistant && !isTyping && !showTypingDots && !!message.content;
  const showStatus = isAssistant && isTyping && isLast && status;

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      {isAssistant && (
        <div className="shrink-0 mt-1">
          <div className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-linear-to-br from-purple-500/20 to-cyan-400/20 border border-white/8">
            <AxiomIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-300/80" />
          </div>
        </div>
      )}

      {/* Bubble */}
      <div
        className={`relative min-w-0 max-w-[92%] sm:max-w-[88%] lg:max-w-[85%] xl:max-w-[88%] px-4 py-3 sm:px-5 sm:py-4 rounded-2xl text-base sm:text-lg leading-relaxed wrap-break-word ${
          isUser
            ? "bg-primary-fixed/50 text-white rounded-br-md shadow-lg shadow-primary/10"
            : `bg-surface-container-low/15 text-on-surface border rounded-bl-md backdrop-blur-sm ${message.error ? "border-red-400/40" : "border-outline-variant/20"}`
        }`}
      >
        {message.documents && message.documents.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.documents.map((doc) => (
              <PdfBadge key={doc.id} doc={doc} />
            ))}
          </div>
        )}

        {showTypingDots ? (
          <div className="flex flex-col gap-1">
            <div className="flex gap-1.5 py-1">
              <span className="h-2 w-2 rounded-full bg-purple-400/60 animate-bounce [animation-delay:0ms]" />
              <span className="h-2 w-2 rounded-full bg-purple-400/60 animate-bounce [animation-delay:150ms]" />
              <span className="h-2 w-2 rounded-full bg-purple-400/60 animate-bounce [animation-delay:300ms]" />
            </div>
            {showStatus && (
              <span className="text-xs text-white/40 italic">{status}</span>
            )}
          </div>
        ) : isAssistant ? (
          <Markdown content={message.content} />
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}

        {showPulseCursor && (
          <span className="inline-block w-2 h-4 sm:h-5 ml-0.5 align-middle bg-purple-300/80 rounded-sm animate-pulse-cursor" />
        )}

        {showStatus && !showTypingDots && (
          <span className="block text-xs text-white/40 italic mt-1">{status}</span>
        )}

        {message.error && (
          <span className="block text-xs mt-2 text-red-400/80">
            Error generating response
          </span>
        )}

        {!hideTimestamp && (
          <div className="flex items-center justify-between gap-2 mt-2">
            <span
              className={`text-xs tracking-wide ${
                isUser ? "text-white/40 text-right" : "text-white/25"
              }`}
            >
              {formatTime(message.timestamp)}
            </span>
            {isFinishedAssistant && <CopyMessageButton text={message.content} />}
          </div>
        )}
      </div>
    </div>
  );
}
