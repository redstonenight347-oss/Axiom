export interface TextChunk {
  index: number;
  content: string;
}

export interface ChunkOptions {
  chunkSize?: number;
  overlap?: number;
}

const DEFAULT_CHUNK_SIZE = 2500;
const DEFAULT_OVERLAP = 400;

/**
 * Splits cleaned text into overlapping chunks by character count.
 * Defaults: ~2500 chars per chunk with ~400 char overlap (≈ 16%).
 */
export function chunkText(text: string, options: ChunkOptions = {}): TextChunk[] {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const overlap = options.overlap ?? DEFAULT_OVERLAP;

  if (chunkSize <= 0) {
    throw new Error("chunkSize must be greater than 0");
  }
  if (overlap < 0 || overlap >= chunkSize) {
    throw new Error("overlap must be between 0 and chunkSize");
  }

  const chunks: TextChunk[] = [];
  const step = chunkSize - overlap;
  let index = 0;
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);

    // Try to break at a sentence boundary if we're not at the end.
    if (end < text.length) {
      const boundary = findSentenceBoundary(text, end, chunkSize);
      if (boundary > start) {
        end = boundary;
      }
    }

    const content = text.slice(start, end).trim();
    if (content) {
      chunks.push({ index, content });
      index++;
    }

    if (end >= text.length) break;
    start += step;

    // Avoid infinite loops when step is 0.
    if (step <= 0) break;
  }

  return chunks;
}

function findSentenceBoundary(text: string, target: number, maxLookback: number): number {
  const lookbackStart = Math.max(target - maxLookback, 0);
  const searchWindow = text.slice(lookbackStart, target);

  // Prefer sentence-ending punctuation followed by whitespace.
  const sentenceMatch = searchWindow.match(/[.!?]\s+/g);
  if (sentenceMatch) {
    const lastMatch = sentenceMatch[sentenceMatch.length - 1];
    const idx = searchWindow.lastIndexOf(lastMatch);
    if (idx !== -1) {
      return lookbackStart + idx + lastMatch.length;
    }
  }

  // Fallback to newline boundary.
  const newlineIdx = searchWindow.lastIndexOf("\n");
  if (newlineIdx !== -1) {
    return lookbackStart + newlineIdx + 1;
  }

  // Fallback to space boundary.
  const spaceIdx = searchWindow.lastIndexOf(" ");
  if (spaceIdx !== -1) {
    return lookbackStart + spaceIdx + 1;
  }

  return target;
}
