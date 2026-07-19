# Axiom

Axiom is a modern, multi-user AI chatbot built with **Next.js 16**, **React 19**, and **TypeScript**. It delivers a ChatGPT/Claude-like experience with streaming responses, optional web search, and PDF-based document Q&A using vector retrieval (RAG).

![Tech stack](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![Gemini](https://img.shields.io/badge/Gemini-AI-blue?logo=google)
![Tavily](https://img.shields.io/badge/Tavily-Search-green)
![Better Auth](https://img.shields.io/badge/Better%20Auth-Auth-purple)

## Features

- **Conversational AI** — Streaming assistant responses powered by Google's Gemini models.
- **Smart Web Search** — Uses a planner/executor/summarizer pipeline with Tavily to answer current or factual questions.
- **PDF Document Q&A (RAG)** — Upload PDFs, chunk and embed them with Gemini embeddings, then ask questions grounded in the document content.
- **Multi-User Authentication** — Email/password and Google OAuth via Better Auth, backed by Drizzle + Postgres.
- **Persistent Chat History** — Chats and messages stored in Postgres with a sidebar for browsing past conversations.
- **Model Fallbacks** — Automatically cycles through Gemini models on rate-limit or quota errors.
- **Dark Glassmorphism UI** — Responsive, animated interface with Markdown rendering, code highlighting, and copy-to-clipboard.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| AI Models | Google Gemini (via `@google/genai`) |
| Embeddings | `gemini-embedding-2` (3072-dim vectors) |
| Web Search | Tavily API |
| Auth | Better Auth (email/password + Google OAuth) |
| Database | Neon serverless Postgres |
| ORM | Drizzle ORM + Drizzle Kit |
| State | Zustand |
| PDF Parsing | pdfjs-dist / pdf-parse |
| Vector Search | pgvector |

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React Client  │────▶│  Next.js API     │────▶│  Gemini (LLM)   │
│  (Zustand + UI) │◀────│  (chat pipeline) │◀────│  Tavily Search  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │ Neon Postgres│
                        │  + pgvector  │
                        └──────────────┘
```

### Chat Pipeline

1. **Planner** (`lib/ai/planner.ts`) — Gemini decides whether to answer directly, ask for clarification, or run web searches.
2. **Executor** (`lib/ai/executor.ts`) — Runs Tavily searches in parallel with retries and timeouts.
3. **Summarizer** (`lib/ai/summarizer.ts`) — Condenses large search results per query.
4. **Report Generator** (`lib/ai/report-generator.ts`) — Synthesizes raw results or summaries into a final Markdown report.
5. **Model Router** (`lib/ai/model-router.ts`) — Falls back to alternative Gemini models on rate limits.

### Document RAG Pipeline

1. PDFs are parsed and cleaned (`lib/pdf/*`).
2. Text is split into overlapping chunks (`lib/pdf/chunker.ts`).
3. Chunks are embedded with Gemini and stored in `embedding` table (`lib/ai/embeddings.ts`).
4. User queries are embedded and matched via pgvector cosine similarity (`lib/ai/retrieval.ts`).
5. Top-k chunks are injected into the prompt for grounded answers.

## Project Structure

```
app/
  api/
    auth/[...all]/      # Better Auth handler
    chat/               # Main streaming chat endpoint
    chats/              # List / delete chats
    chats/[id]/         # Load a single chat
    upload/pdf/         # PDF upload + chunking + embedding
  auth/                 # Sign-in / sign-up page
  chats/                # Chat UI components and logic
  layout.tsx            # Root layout with Geist fonts
  page.tsx              # Redirects to /chats

components/
  ui/                   # Reusable UI pieces (header, input, welcome, etc.)
  ChatSidebar.tsx       # Conversation history sidebar

lib/
  ai/                   # AI orchestration, tools, search, embeddings
  auth/                 # Better Auth server + client
  db/                   # Drizzle schema and Neon client
  pdf/                  # PDF parsing, cleaning, chunking

services/
  chat-pipeline.ts      # Core chat orchestration logic
  chat-session.ts       # Chat/message persistence helpers
  prompt.ts             # Prompt builders (history + RAG)
  sse.ts                # Server-sent event helpers
  error-helpers.ts      # Rate-limit detection helpers

store/
  chatStore.ts          # Zustand store for chat state

drizzle/                # Generated migrations
```

## Getting Started

### Prerequisites

- Node.js 20+
- A Neon Postgres database (or any Postgres with `pgvector` extension)
- API keys for Gemini and Tavily
- (Optional) Google OAuth credentials

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
# AI providers
GEMINI_API_KEY=your_gemini_api_key
TAVILY_API_KEY=your_tavily_api_key
GEMINI_EMBEDDING_MODEL=gemini-embedding-2

# Database (Neon serverless Postgres)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Better Auth
BETTER_AUTH_SECRET=your_random_secret
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Optional: upload limits
MAX_UPLOAD_SIZE_MB=10
NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB=10
```

### 3. Push the database schema

```bash
npm run db:push
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated users are redirected to `/auth` to sign in or sign up.

## Database Scripts

| Script | Description |
|--------|-------------|
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run pending Drizzle migrations |
| `npm run db:push` | Push schema changes directly to the database |

## Configuration Notes

- **Gemini models** are configured in `lib/ai/config.ts`. The router tries models in order on rate-limit errors.
- **Search limits** (max queries, results, summary length) are also in `lib/ai/config.ts`.
- **Conversation history** length is controlled by `MAX_HISTORY_MESSAGES` in `lib/ai/config.ts`.
- **PDF chunking** defaults to ~2500 characters per chunk with ~400 character overlap.

## Deployment

Axiom is designed to run on Vercel or any Node.js hosting platform that supports Next.js:

1. Set all environment variables in your hosting dashboard.
2. Ensure your Postgres provider has the `pgvector` extension enabled.
3. Run `npm run db:push` (or `npm run db:migrate`) against your production database.
4. Deploy with `npm run build`.

### Docker

You can also build and run Axiom as a Docker container.

**Build the image:**

```bash
docker build -t axiom .
```

**Run the container:**

```bash
docker run -d \
  -p 3000:3000 \
  --env-file .env.local \
  --name axiom \
  axiom
```

Make sure your `.env.local` contains all required variables (see the [Configure environment variables](#2-configure-environment-variables) section). The container starts the Next.js standalone server on port `3000`.

## License

[MIT](LICENSE)
