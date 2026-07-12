"use client";

import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

interface MarkdownProps {
  content: string;
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard errors.
    }
  }, [code]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 px-2 py-1 text-[10px] rounded-md bg-white/10 hover:bg-white/15 text-white/70 hover:text-white/90 transition-colors border border-white/10"
      aria-label={copied ? "Copied" : "Copy code"}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function Markdown({ content }: MarkdownProps) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          pre({ children }) {
            const codeElement =
              Array.isArray(children) ? children[0] : children;
            const code =
              typeof codeElement === "object" &&
              codeElement !== null &&
              "props" in codeElement &&
              typeof codeElement.props.children === "string"
                ? codeElement.props.children
                : "";

            return (
              <div className="relative group my-4 rounded-xl overflow-hidden border border-white/10 bg-black/40">
                <CopyButton code={code} />
                <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
                  {children}
                </pre>
              </div>
            );
          },
          code({ className, children, ...props }) {
            const isInline = !className;
            return isInline ? (
              <code
                className="px-1.5 py-0.5 rounded-md bg-white/10 text-purple-200 text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          a({ children, ...props }) {
            return (
              <a
                className="text-purple-300 hover:text-purple-200 underline underline-offset-2 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            );
          },
          ul({ children }) {
            return (
              <ul className="list-disc pl-5 my-3 space-y-1.5 text-white/85 text-base leading-relaxed">
                {children}
              </ul>
            );
          },
          ol({ children }) {
            return (
              <ol className="list-decimal pl-5 my-3 space-y-1.5 text-white/85 text-base leading-relaxed">
                {children}
              </ol>
            );
          },
          li({ children }) {
            return <li className="pl-1 marker:text-white/50">{children}</li>;
          },
          h1({ children }) {
            return (
              <h1 className="text-xl font-semibold text-white mt-5 mb-3 tracking-tight">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-lg font-semibold text-white mt-4 mb-2 tracking-tight">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-base font-semibold text-white mt-4 mb-2 tracking-tight">
                {children}
              </h3>
            );
          },
          p({ children }) {
            return <p className="my-2 text-white/85 text-base leading-relaxed">{children}</p>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-purple-400/40 pl-4 my-3 italic text-white/60 text-base leading-relaxed">
                {children}
              </blockquote>
            );
          },
          hr() {
            return <hr className="my-5 border-white/10" />;
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4 rounded-lg border border-white/10">
                <table className="w-full text-sm text-left text-white/85">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead className="bg-white/5 text-white/90 text-xs uppercase">
                {children}
              </thead>
            );
          },
          th({ children }) {
            return (
              <th className="px-3 py-2.5 font-medium border-b border-white/10">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-3 py-2.5 border-b border-white/5">{children}</td>
            );
          },
          strong({ children }) {
            return <strong className="font-semibold text-white/95">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic text-white/80">{children}</em>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
