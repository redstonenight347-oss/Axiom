# Axiom

An advanced AI chatbot built with Next.js 16, Gemini, Tavily, and Better Auth.

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.local` and fill in the values:

```bash
# AI providers
GEMINI_API_KEY=...
TAVILY_API_KEY=...

# Database (Neon serverless Postgres)
DATABASE_URL=postgresql://...

# Better Auth
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

3. Push the database schema:

```bash
npm run db:push
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated users will be redirected to `/auth` to sign in or sign up.

## Database scripts

- `npm run db:generate` — generate Drizzle migrations
- `npm run db:migrate` — run Drizzle migrations
- `npm run db:push` — push schema changes directly to the database

## Project structure

- `app/chats/*` — chat UI components and logic
- `app/api/chat/route.ts` — AI chat API route
- `app/api/auth/[...all]/route.ts` — Better Auth API route
- `app/auth/page.tsx` — sign-in / sign-up page
- `lib/ai/*` — AI orchestration, tools, search
- `lib/auth/*` — Better Auth server and client
- `lib/db/*` — Drizzle schema and Neon client
