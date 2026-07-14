export function extractErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function isRateLimitError(err: unknown): boolean {
  if (!err) return false;
  const status = (err as { status?: number }).status;
  const message = extractErrorMessage(err);
  return (
    status === 429 ||
    message.includes("Quota exceeded") ||
    message.includes("quota") ||
    message.includes("Rate limit") ||
    message.includes("rate limit") ||
    message.includes("Resource exhausted")
  );
}

export function getRateLimitMessage(): string {
  return "Gemini API rate limit or daily quota exceeded. Please try again in a moment.";
}
