import Link from "next/link";
import Image from "next/image";
import { AxiomIcon } from "@/components/ui/AxiomIcon";

const FEATURES = [
  {
    title: "Conversational AI",
    description:
      "Streaming assistant responses powered by Google's Gemini models for a natural chat experience.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    title: "Smart Web Search",
    description:
      "Planner, executor, and summarizer pipeline with Tavily to answer current and factual questions.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    title: "PDF Document Q&A",
    description:
      "Upload PDFs, embed them with Gemini vectors, and ask questions grounded in the document content.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: "Multi-User Auth",
    description:
      "Secure email/password and Google OAuth sign-in powered by Better Auth and Drizzle + Postgres.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    title: "Persistent History",
    description:
      "Chats and messages are stored in Postgres so you can pick up any conversation right where you left off.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Model Fallbacks",
    description:
      "Automatically cycles through Gemini models when rate limits or quota errors occur.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
];

const TECH_STACK = [
  "Next.js 16",
  "React 19",
  "TypeScript",
  "Tailwind CSS 4",
  "Google Gemini",
  "Tavily",
  "Better Auth",
  "Neon Postgres",
  "pgvector",
  "Zustand",
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-[#e5e2e1]">
      {/* Ambient gradient background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-1/4 top-0 h-150 w-150 rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute -right-1/4 bottom-0 h-175 w-175 rounded-full bg-cyan-600/15 blur-[140px]" />
        <div className="absolute left-1/3 top-1/3 h-100 w-100 rounded-full bg-blue-600/10 blur-[100px]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Navigation */}
        <nav className="flex items-center justify-between px-6 py-5 md:px-10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-purple-500 to-cyan-400 shadow-lg shadow-purple-500/20">
              <AxiomIcon className="h-5 w-5 text-white" strokeWidth={2} />  
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">Axiom</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/auth"
              className="hidden rounded-xl px-4 py-2 text-sm font-medium text-white/70 transition hover:text-white sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/auth?mode=signup"
              className="rounded-xl bg-linear-to-r from-purple-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-purple-500/20 transition hover:opacity-90"
            >
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-10 text-center md:px-10">
          <div className="relative mb-8">
            <div className="absolute inset-0 scale-150 rounded-full bg-primary/20 blur-3xl animate-pulse" />
            <Image
              src="/favicon.png"
              alt="Axiom logo"
              width={120}
              height={120}
              className="relative z-10 h-28 w-28 rounded-3xl shadow-2xl animate-axiom-pulse md:h-32 md:w-32"
              priority
            />
          </div>

          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
            Your cognitive architecture for{" "}
            <span className="bg-linear-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              RAG-powered
            </span>{" "}
            intelligence
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/60 sm:text-xl">
            Axiom is a modern AI chatbot that combines streaming conversation, real-time web search, and PDF document Q&A into one clean experience.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/auth?mode=signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-purple-500 to-cyan-500 px-7 py-3 text-base font-medium text-white shadow-lg shadow-purple-500/20 transition hover:opacity-90"
            >
              Get Started Free
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-7 py-3 text-base font-medium text-white/90 backdrop-blur-md transition hover:bg-white/10"
            >
              Sign In
            </Link>
          </div>
        </section>

        {/* About + Features */}
        <section className="px-6 py-20 md:px-10">
          <div className="mx-auto max-w-5xl">
            <div className="mb-14 text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Built for deep questions
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">
                Whether you are researching online, reading a PDF, or just brainstorming, Axiom brings together the tools you need to get grounded, sourced answers.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-white/8 bg-white/3 p-6 backdrop-blur-xl transition hover:border-white/15 hover:bg-white/5"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-purple-500/20 to-cyan-500/20 text-purple-300 ring-1 ring-white/10 transition group-hover:text-cyan-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-medium text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tech stack */}
        <section className="border-t border-white/8 bg-white/2 px-6 py-14 md:px-10">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-lg font-medium text-white/90">Powered by a modern stack</h2>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {TECH_STACK.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20 text-center md:px-10">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Ready to chat smarter?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/55">
            Create a free account and start exploring the web, your documents, and your ideas with Axiom.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth?mode=signup"
              className="inline-flex items-center justify-center rounded-xl bg-linear-to-r from-purple-500 to-cyan-500 px-7 py-3 text-base font-medium text-white shadow-lg shadow-purple-500/20 transition hover:opacity-90"
            >
              Create account
            </Link>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-7 py-3 text-base font-medium text-white/90 transition hover:bg-white/10"
            >
              Already have one? Sign in
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/8 px-6 py-8 md:px-10">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <AxiomIcon className="h-5 w-5 text-white/70" strokeWidth={2} />
              <span className="text-sm font-medium text-white/70">Axiom</span>
            </div>
            <p className="text-sm text-white/40">
              © {new Date().getFullYear()} Axiom. Built with Next.js 16, React 19 & TypeScript.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
