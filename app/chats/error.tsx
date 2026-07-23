"use client";

import { ErrorCard } from "@/components/ui/error";

export default function ChatsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorCard
      error={error}
      reset={reset}
      title="Couldn’t load chat"
      description="Something went wrong while loading your chats. Try again or return to the chat list."
    />
  );
}
