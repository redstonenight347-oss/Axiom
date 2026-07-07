import { AxiomIcon } from "./AxiomIcon";
import type { Message } from "./types";

interface MessageBubbleProps {
  message: Message;
  isTyping: boolean;
  isLast: boolean;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({ message, isTyping, isLast }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const showTypingDots = isAssistant && !message.content && isTyping;
  const hideTimestamp = isAssistant && isTyping && isLast;

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      {isAssistant && (
        <div className="shrink-0 mt-1">
          <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-linear-to-br from-purple-500/20 to-cyan-400/20 border border-white/8">
            <AxiomIcon className="h-4 w-4 text-purple-300/80" />
          </div>
        </div>
      )}

      {/* Bubble */}
      <div
        className={`relative max-w-[80%] px-4 py-3 rounded-2xl text-[14px] leading-relaxed ${
          isUser
            ? "bg-linear-to-br from-purple-600/80 to-indigo-600/80 text-white rounded-br-md shadow-lg shadow-purple-500/10"
            : `bg-white/5 text-white/85 border rounded-bl-md backdrop-blur-sm ${message.error ? "border-red-400/40" : "border-white/6"}`
        }`}
      >
        {showTypingDots ? (
          <div className="flex gap-1.5 py-1">
            <span className="h-2 w-2 rounded-full bg-purple-400/60 animate-bounce [animation-delay:0ms]" />
            <span className="h-2 w-2 rounded-full bg-purple-400/60 animate-bounce [animation-delay:150ms]" />
            <span className="h-2 w-2 rounded-full bg-purple-400/60 animate-bounce [animation-delay:300ms]" />
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
        {message.error && (
          <span className="block text-[10px] mt-2 text-red-400/80">
            Error generating response
          </span>
        )}
        {!hideTimestamp && (
          <span
            className={`block text-[10px] mt-2 ${
              isUser ? "text-white/40 text-right" : "text-white/25"
            }`}
          >
            {formatTime(message.timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}
