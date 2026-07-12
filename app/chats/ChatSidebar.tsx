"use client";

import { useRouter } from "next/navigation";

interface ChatListItem {
  id: string;
  title: string;
  updatedAt: string;
}

interface ChatSidebarProps {
  chats: ChatListItem[];
  activeChatId: string | null;
  isLoading: boolean;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ChatSidebar({
  chats,
  activeChatId,
  isLoading,
  onNewChat,
  onDeleteChat,
}: ChatSidebarProps) {
  const router = useRouter();

  return (
    <aside className="w-64 shrink-0 border-r border-white/8 bg-[#0a0a0f]/95 backdrop-blur-xl flex flex-col h-full">
      <div className="p-4 border-b border-white/8">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-linear-to-br from-purple-500 to-indigo-500 text-white py-2.5 px-4 text-base font-medium shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-xl bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <p className="text-base text-white/30 text-center py-8 leading-relaxed">
            No chats yet. Start a new conversation.
          </p>
        ) : (
          <ul className="space-y-1">
            {chats.map((item) => {
              const isActive = item.id === activeChatId;
              return (
                <li key={item.id}>
                  <div
                    className={`group flex items-center justify-between rounded-xl px-3 py-2.5 cursor-pointer transition-colors duration-200 ${
                      isActive
                        ? "bg-white/10 border border-white/8"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                    onClick={() => router.push(`/chats?id=${encodeURIComponent(item.id)}`)}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-base truncate ${
                          isActive ? "text-white" : "text-white/70"
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="text-xs text-white/30 mt-0.5 tracking-wide">
                        {formatDate(item.updatedAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/5 transition-all duration-200"
                      aria-label="Delete chat"
                      title="Delete chat"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
