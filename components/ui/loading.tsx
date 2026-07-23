import { AxiomIcon } from "./AxiomIcon";

export function FullscreenLoader() {
  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] text-[#e5e2e1]">
      <div className="relative">
        <div className="absolute inset-0 scale-150 rounded-full bg-purple-500/20 blur-3xl animate-pulse" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br from-purple-500 to-cyan-400 shadow-2xl shadow-purple-500/25 animate-axiom-pulse">
          <AxiomIcon className="h-9 w-9 text-white" strokeWidth={2} />
        </div>
      </div>
      <p className="mt-5 text-sm font-medium text-white/50">Loading Axiom…</p>
    </div>
  );
}

export function AuthCardSkeleton() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0f] px-4 text-white">
      <div className="relative z-10 w-full max-w-92 rounded-3xl border border-white/8 bg-white/3 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-purple-500 to-cyan-400 shadow-lg shadow-purple-500/20">
            <AxiomIcon className="h-6 w-6 text-white" />
          </div>
          <div className="mt-4 h-7 w-40 rounded-lg bg-white/10 animate-pulse" />
          <div className="mt-2 h-4 w-56 rounded-md bg-white/5 animate-pulse" />
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="h-3.5 w-10 rounded bg-white/10 animate-pulse" />
            <div className="h-10 w-full rounded-xl bg-white/5 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3.5 w-10 rounded bg-white/10 animate-pulse" />
            <div className="h-10 w-full rounded-xl bg-white/5 animate-pulse" />
          </div>
          <div className="h-10 w-full rounded-xl bg-white/10 animate-pulse" />
        </div>

        <div className="relative my-5 flex items-center">
          <div className="flex-1 border-t border-white/10" />
          <span className="mx-3 text-xs text-white/30">or</span>
          <div className="flex-1 border-t border-white/10" />
        </div>

        <div className="h-10 w-full rounded-xl bg-white/5 animate-pulse" />

        <div className="mt-6 mx-auto h-4 w-48 rounded-md bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="flex h-full w-70 flex-col border-r border-outline-variant/20 bg-surface-container-low/10 backdrop-blur-2xl">
      <div className="flex items-center justify-between px-4 h-18 shrink-0 border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-purple-500 to-cyan-400">
            <AxiomIcon className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="h-4 w-16 rounded-md bg-white/10 animate-pulse" />
        </div>
        <div className="h-8 w-8 rounded-lg bg-white/5 animate-pulse" />
      </div>
      <div className="flex-1 space-y-2 p-3 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-11 w-full rounded-xl bg-white/5 animate-pulse"
            style={{ opacity: 1 - i * 0.12 }}
          />
        ))}
      </div>
      <div className="p-3 border-t border-outline-variant/20">
        <div className="h-10 w-full rounded-xl bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}

export function ChatLayoutSkeleton() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0a0a]">
      {/* Desktop sidebar */}
      <div className="hidden md:block shrink-0">
        <SidebarSkeleton />
      </div>

      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="flex items-center justify-between w-full px-6 h-18 bg-surface-container-low/3 backdrop-blur-2xl border-b border-outline-variant/20 z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="md:hidden h-9 w-9 rounded-xl bg-white/5 animate-pulse" />
            <div className="h-5 w-32 rounded-md bg-white/10 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-white/5 animate-pulse" />
            <div className="h-9 w-9 rounded-xl bg-white/5 animate-pulse" />
          </div>
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex gap-3">
              <div className="h-8 w-8 shrink-0 rounded-full bg-white/10 animate-pulse" />
              <div className="h-20 w-[80%] rounded-2xl rounded-tl-none bg-white/5 animate-pulse" />
            </div>
            <div className="flex flex-row-reverse gap-3">
              <div className="h-8 w-8 shrink-0 rounded-full bg-purple-500/20 animate-pulse" />
              <div className="h-16 w-[70%] rounded-2xl rounded-tr-none bg-white/10 animate-pulse" />
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 shrink-0 rounded-full bg-white/10 animate-pulse" />
              <div className="h-32 w-[90%] rounded-2xl rounded-tl-none bg-white/5 animate-pulse" />
            </div>
          </div>
        </main>

        {/* Input */}
        <footer className="w-full px-4 pb-5 pt-2 z-20">
          <div className="mx-auto max-w-3xl flex items-end gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-xl">
            <div className="h-10 flex-1 rounded-xl bg-white/5 animate-pulse" />
            <div className="h-10 w-10 shrink-0 rounded-xl bg-white/10 animate-pulse" />
          </div>
        </footer>
      </div>
    </div>
  );
}

export function SettingsLayoutSkeleton() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0a0a]">
      {/* Desktop sidebar */}
      <div className="hidden md:block shrink-0">
        <SidebarSkeleton />
      </div>

      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="flex items-center justify-between w-full px-6 h-18 bg-surface-container-low/3 backdrop-blur-2xl border-b border-outline-variant/20 z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="md:hidden h-9 w-9 rounded-xl bg-white/5 animate-pulse" />
            <div className="hidden sm:block h-5 w-28 rounded-md bg-white/10 animate-pulse" />
          </div>
          <div className="h-6 w-24 rounded-lg bg-white/10 animate-pulse" />
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="space-y-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low/10 backdrop-blur-xl p-6">
              <div className="h-6 w-24 rounded-lg bg-white/10 animate-pulse" />
              <div className="h-4 w-48 rounded-md bg-white/5 animate-pulse" />
              <div className="mt-4 space-y-3">
                <div className="h-12 w-full rounded-xl bg-white/5 animate-pulse" />
                <div className="h-12 w-full rounded-xl bg-white/5 animate-pulse" />
              </div>
            </div>
            <div className="space-y-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low/10 backdrop-blur-xl p-6">
              <div className="h-6 w-20 rounded-lg bg-white/10 animate-pulse" />
              <div className="h-4 w-56 rounded-md bg-white/5 animate-pulse" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
                <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
              </div>
            </div>
            <div className="space-y-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low/10 backdrop-blur-xl p-6">
              <div className="h-6 w-16 rounded-lg bg-white/10 animate-pulse" />
              <div className="h-4 w-64 rounded-md bg-white/5 animate-pulse" />
              <div className="mt-4 space-y-3">
                <div className="h-20 rounded-xl bg-white/5 animate-pulse" />
                <div className="h-20 rounded-xl bg-white/5 animate-pulse" />
                <div className="h-20 rounded-xl bg-white/5 animate-pulse" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
