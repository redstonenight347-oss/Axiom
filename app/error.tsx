"use client";

import { ErrorCard } from "@/components/ui/error";

export default function RootError({
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
      title="Something went wrong"
      description="We hit an unexpected error loading Axiom. Try again or head back to the chat."
    />
  );
}
