import { AxiomIcon } from "./AxiomIcon";
import { WELCOME_SUGGESTIONS } from "./types";

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
}

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-24 animate-fade-in">
      {/* Logo orb */}
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-linear-to-br from-purple-500/30 to-cyan-400/30 blur-2xl scale-150 animate-pulse-slow" />
        <div className="relative flex items-center justify-center h-20 w-20 rounded-full g-linear-to-br from-purple-500/20 to-cyan-400/20 border border-white/8 backdrop-blur-sm">
          <AxiomIcon className="h-9 w-9 text-purple-300/80" strokeWidth={1.5} />
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
            onClick={() => onSuggestionClick(s)}
            className="group relative px-4 py-2.5 rounded-2xl text-[13px] text-white/60 border border-white/[0.07] bg-white/3 backdrop-blur-sm hover:border-purple-400/30 hover:text-white/90 hover:bg-white/6 transition-all duration-300 cursor-pointer"
          >
            <span className="absolute inset-0 rounded-2xl bg-linear-to-r from-purple-500/0 to-cyan-400/0 group-hover:from-purple-500/5 group-hover:to-cyan-400/5 transition-all duration-300" />
            <span className="relative">{s}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
