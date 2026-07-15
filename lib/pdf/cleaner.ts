/**
 * Cleans raw PDF text into normalized, readable text.
 * - Collapses whitespace and line breaks.
 * - Removes common page noise (repeated digits, URLs, email-like fragments).
 * - Normalizes Unicode and trims aggressively.
 */
export function cleanPdfText(raw: string): string {
  let text = raw;

  // Remove null bytes and control chars except newlines/tabs.
  text = text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");

  // Normalize Unicode spaces to regular space.
  text = text.replace(/\u00a0/g, " ");

  // Replace multiple whitespace with a single space, but preserve paragraph breaks.
  text = text.replace(/[ \t]+/g, " ");

  // Collapse 3+ consecutive newlines into two (paragraph break).
  text = text.replace(/\n{3,}/g, "\n\n");

  // Remove lines that look like isolated page numbers or short headers/footers.
  text = text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";

      // Skip lines that are just a number (page number).
      if (/^\d+$/.test(trimmed) && trimmed.length <= 4) return "";

      // Skip lines that are just a date.
      if (/^\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}$/.test(trimmed)) return "";

      return line;
    })
    .join("\n");

  // Remove repeated paragraph breaks introduced by removed lines.
  text = text.replace(/\n{3,}/g, "\n\n");

  // Trim and ensure single trailing newline.
  return text.trim();
}
