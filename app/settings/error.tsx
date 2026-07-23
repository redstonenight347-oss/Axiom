"use client";

import { ErrorCard } from "@/components/ui/error";

export default function SettingsError({
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
      title="Couldn't load settings"
      description="We ran into an issue loading your settings. Try again or go back to the chat."
    />
  );
}
