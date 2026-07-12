import type { RefObject, SubmitEvent, KeyboardEvent } from "react";

interface ChatInputProps {
  input: string;
  isTyping: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onInputChange: (value: string) => void;
  onSubmit: (e: SubmitEvent) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
}

export function ChatInput({
  input,
  isTyping,
  textareaRef,
  onInputChange,
  onSubmit,
  onKeyDown,
}: ChatInputProps) {
  return (
    <footer className="relative z-10 px-4 pb-5 pt-3">
      {/* Top fade */}
      <div className="pointer-events-none absolute -top-12 left-0 right-0 h-12 bg-linear-to-t from-[#0a0a0f] to-transparent" />

      <form
        onSubmit={onSubmit}
        className="mx-auto max-w-2xl relative flex items-end gap-2 rounded-2xl border border-white/8 bg-white/4 backdrop-blur-xl p-2 shadow-2xl shadow-black/40 transition-all duration-300 focus-within:border-purple-500/30 focus-within:shadow-purple-500/5"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Message Axiom…"
          rows={1}
          className="flex-1 resize-none bg-transparent text-base text-white/90 placeholder:text-white/25 px-3 py-2.5 outline-none max-h-40 custom-scrollbar leading-relaxed"
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

      <p className="text-center text-xs text-white/20 mt-3 tracking-wide">
        Axiom can make mistakes. Verify important information.
      </p>
    </footer>
  );
}
