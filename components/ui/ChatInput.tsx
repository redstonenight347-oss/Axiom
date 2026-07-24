"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useChatStore } from "@/store/chatStore";

const MAX_UPLOAD_SIZE_MB = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB ?? "10");

export function ChatInput() {
  const input = useChatStore((state) => state.input);
  const isTyping = useChatStore((state) => state.isTyping);
  const isUploading = useChatStore((state) => state.isUploading);
  const uploadError = useChatStore((state) => state.uploadError);
  const attachedDocuments = useChatStore((state) => state.attachedDocuments);
  const textareaRef = useChatStore((state) => state.textareaRef);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const setInput = useChatStore((state) => state.setInput);
  const handleSubmit = useChatStore((state) => state.handleSubmit);
  const handleKeyDown = useChatStore((state) => state.handleKeyDown);
  const uploadDocuments = useChatStore((state) => state.uploadDocuments);
  const removeAttachedDocument = useChatStore((state) => state.removeAttachedDocument);
  const clearAttachedDocuments = useChatStore((state) => state.clearAttachedDocuments);

  const validateAndUpload = useCallback(
    async (files: File[]) => {
      const pdfs = files.filter(
        (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
      );
      if (pdfs.length === 0) return;

      const totalSize = pdfs.reduce((sum, file) => sum + file.size, 0);
      const maxSizeBytes = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
      if (totalSize > maxSizeBytes) {
        alert(`Total upload size exceeds ${MAX_UPLOAD_SIZE_MB} MB limit`);
        return;
      }

      await uploadDocuments(pdfs);
    },
    [uploadDocuments]
  );

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      e.target.value = "";
      await validateAndUpload(files);
    },
    [validateAndUpload]
  );

  const onDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files ?? []);
      await validateAndUpload(files);
    },
    [validateAndUpload]
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const canSubmit = input.trim() && !isTyping && !isUploading;

  return (
    <footer className="relative z-10 px-3 sm:px-4 pb-4 sm:pb-5 pt-3">
      {/* Top fade */}
      <div className="pointer-events-none absolute -top-12 left-0 right-0 h-12 bg-linear-to-t" />

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-2xl relative flex flex-col rounded-2xl border border-white/8 bg-white/4 backdrop-blur-xl p-2 shadow-2xl shadow-black/40 transition-all duration-300 focus-within:border-purple-500/30 focus-within:shadow-purple-500/5"
      >
        {/* Drag-and-drop overlay */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={[
            "rounded-xl border-2 border-dashed transition-colors p-2",
            isDragging
              ? "border-purple-400/60 bg-purple-500/10"
              : "border-transparent hover:border-white/10",
          ].join(" ")}
        >
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Axiom…"
              rows={1}
              className="flex-1 resize-none bg-transparent text-base sm:text-lg text-white/90 placeholder:text-white/25 px-3 py-2.5 outline-none max-h-40 custom-scrollbar leading-relaxed"
            />

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={onFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title="Upload PDF"
              className="shrink-0 flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </button>

            <button
              type="submit"
              disabled={!mounted || !canSubmit}
              className="shrink-0 flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-linear-to-br from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/25 disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed hover:shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4.5 w-4.5"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </div>

          {isDragging && (
            <p className="text-center text-sm text-purple-300/80 mt-2">
              Drop PDFs here to upload
            </p>
          )}
        </div>

        {/* Attached documents */}
        {attachedDocuments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 px-2">
            {attachedDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm text-white/80"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-purple-400"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span className="max-w-37.5 truncate">{doc.name}</span>
                <span className="text-white/40 text-xs">({doc.chunkCount} chunks)</span>
                <button
                  type="button"
                  onClick={() => removeAttachedDocument(doc.id)}
                  className="ml-1 text-white/40 hover:text-white/80 transition-colors cursor-pointer"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={clearAttachedDocuments}
              className="text-xs text-white/40 hover:text-white/80 px-2 py-1.5 cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Upload status / error */}
        {isUploading && (
          <p className="px-3 pt-2 text-xs text-purple-300/80">Uploading and indexing PDFs…</p>
        )}
        {uploadError && (
          <p className="px-3 pt-2 text-xs text-red-400">{uploadError}</p>
        )}
      </form>

      <p className="text-center text-[11px] sm:text-xs text-white/20 mt-2 sm:mt-3 tracking-wide">
        Axiom can make mistakes. Verify important information.
      </p>
    </footer>
  );
}
