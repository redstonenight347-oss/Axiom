"use client";

import { ErrorCard } from "@/components/ui/error";

export default function AuthError({
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
      title="Authentication error"
      description="We couldn’t load the sign-in page. Please try again."
    />
  );
}
