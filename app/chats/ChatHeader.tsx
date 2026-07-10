"use client";

import { useRouter } from "next/navigation";
import { AxiomIcon } from "./AxiomIcon";
import { authClient } from "@/lib/auth/client";

export function ChatHeader() {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/auth");
    router.refresh();
  };

  return (
    <header className="relative z-10 flex items-center gap-3 px-6 py-4 border-b border-white/6 bg-white/2 backdrop-blur-md">
      <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-linear-to-br from-purple-500 to-cyan-400 shadow-lg shadow-purple-500/20">
        <AxiomIcon className="h-5 w-5 text-white" />
      </div>
      <div>
        <h1 className="text-[15px] font-semibold tracking-tight">Axiom</h1>
        <p className="text-[11px] text-white/40 leading-none mt-0.5">
          Advanced AI&ensp;·&ensp;Online
        </p>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] text-emerald-400/80 font-medium">
            Ready
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
