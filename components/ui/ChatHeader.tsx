"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { useChatStore } from "@/store/chatStore";
import Image from "next/image";

export function ChatHeader() {
  const router = useRouter();
  const setIsMobileSidebarOpen = useChatStore((state) => state.setIsMobileSidebarOpen);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/auth");
    router.refresh();
  };

  return (
    <header className="flex justify-between items-center w-full px-md h-xl bg-surface-container-low/3 backdrop-blur-2xl border-b border-outline-variant/20 z-20 shrink-0">
      <div className="flex items-center gap-sm">
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="md:hidden shrink-0 flex items-center justify-center h-9 w-9 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition"
          aria-label="Open menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M4 6h16" />
            <path d="M4 12h16" />
            <path d="M4 18h16" />
          </svg>
        </button>

        <img 
          alt="Axiom AI" 
          className="w-8 h-8 md:hidden rounded-lg shadow-lg" 
          src="/axiom_logo.png"
        />
        <span className="text-headline-md font-headline-md tracking-tight text-on-surface">
          Axiom AI
        </span>
      </div>
      
      <div className="flex items-center gap-md">
        <div className="hidden sm:flex items-center gap-1.5 mr-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-label-sm text-emerald-400/80 font-medium tracking-wide">
            Ready
          </span>
        </div>

        <button 
          onClick={handleSignOut}
          className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-xs cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-body-md font-body-md hidden sm:inline font-medium">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
