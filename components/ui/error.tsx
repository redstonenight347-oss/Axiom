"use client";

import Link from "next/link";
import { AxiomIcon } from "./AxiomIcon";

interface ErrorCardProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
}

export function ErrorCard({
  error,
  reset,
  title = "Something went wrong",
  description = "We couldn’t load this page. You can try again or go back to the chat.",
}: ErrorCardProps) {
  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4 text-[#e5e2e1]">
      <div className="w-full max-w-md rounded-3xl border border-white/8 bg-white/3 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-red-500/20 to-purple-500/20 ring-1 ring-white/10">
            <AxiomIcon className="h-7 w-7 text-white/90" strokeWidth={2} />
          </div>
          <h1 className="mt-5 text-xl font-semibold tracking-tight text-white">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            {description}
          </p>
        </div>

        {error.message && (
          <div className="mb-5 rounded-xl border border-red-500/10 bg-red-500/5 p-3">
            <p className="wrap-break-word text-xs leading-relaxed text-red-200/80 font-mono">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-1 text-[10px] text-red-200/50">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-purple-500 to-cyan-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/20 transition hover:opacity-90"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Try again
          </button>
          <Link
            href="/chats"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Back to chat
          </Link>
        </div>
      </div>
    </div>
  );
}
