export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  error?: boolean;
}

export const WELCOME_SUGGESTIONS = [
  "Explain quantum computing in simple terms",
  "Write a haiku about the ocean",
  "How does a neural network learn?",
];
