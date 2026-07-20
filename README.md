# Axiom

A modern, multi-user AI chatbot built with **Next.js 16**, **React 19**, and **TypeScript**. Axiom delivers a ChatGPT/Claude-like experience with streaming responses, optional web search, and PDF-based document Q&A using vector retrieval (RAG).

[![Live Demo](https://img.shields.io/badge/Live%20Demo-axiom--rag--app.vercel.app-000?logo=vercel&logoColor=white&style=for-the-badge)](https://axiom-rag-app.vercel.app)
[![Docker Hub](https://img.shields.io/badge/Docker%20Hub-redstonenight%2Faxiom%3Alatest-2496ed?logo=docker&logoColor=white&style=for-the-badge)](https://hub.docker.com/r/redstonenight/axiom)

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
3. Chunks are embedded with Gemini and stored in the `embedding` table (`lib/ai/embeddings.ts`).
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
- A Postgres database with the `pgvector` extension enabled (e.g., Neon)
- A [Google AI Studio](https://aistudio.google.com/) API key for Gemini
- A [Tavily](https://tavily.com/) API key for web search
- (Optional) Google OAuth credentials for social sign-in

### 1. Clone and install

```bash
git clone https://github.com/redstonenight347-oss/Axiom.git
cd Axiom
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key |
| `TAVILY_API_KEY` | Tavily search API key |
| `DATABASE_URL` | Postgres connection string (must include `pgvector`) |
| `BETTER_AUTH_SECRET` | Random secret for Better Auth session signing |
| `BETTER_AUTH_URL` | Better Auth base URL (`http://localhost:3000` locally) |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Public Better Auth base URL |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (optional) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret (optional) |
| `MAX_UPLOAD_SIZE_MB` | Server-side PDF upload limit |
| `NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB` | Client-side PDF upload limit |
| `GEMINI_EMBEDDING_MODEL` | Gemini embedding model name (default: `gemini-embedding-2`) |

See [`.env.example`](.env.example) for the full template.

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

### Vercel

Axiom is deployed live at **https://axiom-rag-app.vercel.app**.

To deploy your own instance:

1. Import the repository into [Vercel](https://vercel.com/).
2. Add all environment variables from `.env.example` to the Vercel dashboard.
3. Ensure your Postgres provider has the `pgvector` extension enabled.
4. Run `npm run db:push` (or `npm run db:migrate`) against your production database.
5. Deploy with `npm run build`.

### Docker

A pre-built image is available on Docker Hub:

**Pull and run:**

```bash
docker pull redstonenight/axiom:latest

docker run -d \
  -p 3000:3000 \
  --env-file .env.local \
  --name axiom \
  redstonenight/axiom:latest
```

The container starts the Next.js standalone server on port `3000`. Make sure your `.env.local` contains all required variables (see the [environment variables](#2-configure-environment-variables) section).

**Build locally (optional):**

```bash
docker build -t axiom .

docker run -d \
  -p 3000:3000 \
  --env-file .env.local \
  --name axiom \
  axiom
```

## License

[MIT](LICENSE)
