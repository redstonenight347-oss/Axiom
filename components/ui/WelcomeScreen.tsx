"use client";

import { useChatStore } from "@/store/chatStore";
import { WELCOME_SUGGESTIONS } from "@/app/chats/types";

const SUGGESTION_ICONS = [
  <svg key="lightbulb" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>,
  <svg key="edit_note" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>,
  <svg key="neurology" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
];

export function WelcomeScreen() {
  const handleSuggestionClick = useChatStore((state) => state.handleSuggestionClick);

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-16 sm:py-24 animate-fade-in relative z-10 w-full">
      <div className="max-w-2xl w-full text-center flex flex-col items-center gap-lg">
        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-primary/20 scale-150 animate-pulse"></div>
          <img 
            alt="Axiom Central Logo" 
            className="w-32 h-32 md:w-40 md:h-40 rounded-4xl relative z-10 animate-axiom-pulse shadow-2xl" 
            src="/favicon.png"
          />
        </div>
        
        <div className="space-y-sm">
          <h1 className="text-display-lg font-display-lg tracking-tight text-on-surface">
            How can I help you today?
          </h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Your cognitive architecture for RAG-powered intelligence. Experience the next generation of neural retrieval.
          </p>
        </div>

        {/* Suggestion Bento/Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-sm w-full mt-lg">
          {WELCOME_SUGGESTIONS.map((suggestion, i) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className="group glass-level-1 p-md rounded-xl text-left hover:scale-[1.02] hover:bg-white/10 transition-all duration-300 cursor-pointer"
            >
              <span className="text-primary mb-xs block">
                {SUGGESTION_ICONS[i % SUGGESTION_ICONS.length]}
              </span>
              <span className="text-body-md font-medium text-on-surface group-hover:text-primary-fixed transition-colors">
                {suggestion}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
