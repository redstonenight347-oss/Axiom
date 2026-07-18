export interface AttachedDocument {
  id: string;
  name: string;
  totalPages: number;
  chunkCount: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  error?: boolean;
  documents?: AttachedDocument[];
}

export const WELCOME_SUGGESTIONS = [
  "Explain quantum computing in simple terms",
  "Write a haiku about the ocean",
  "How does a neural network learn?",
];
