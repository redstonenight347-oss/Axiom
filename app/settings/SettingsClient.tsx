"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useChatStore } from "@/store/chatStore";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { ChatSidebar } from "@/components/ChatSidebar";
import { authClient } from "@/lib/auth/client";
import { GEMINI_MODELS, MODEL_LIMITS } from "@/lib/ai/constants";

interface SettingsUser {
  id: string;
  name: string;
  email: string;
}

interface UserSettings {
  preferredModel?: string | null;
  customPrompt?: string | null;
}

interface UsageItem {
  model: string;
  requestsUsedMinute: number;
  requestsUsedDay: number;
  tokensUsedDay: number;
}

interface SettingsClientProps {
  user: SettingsUser;
}

export function SettingsClient({ user }: SettingsClientProps) {
  const router = useRouter();
  const isMobileSidebarOpen = useChatStore((state) => state.isMobileSidebarOpen);
  const setIsMobileSidebarOpen = useChatStore((state) => state.setIsMobileSidebarOpen);
  const loadChats = useChatStore((state) => state.loadChats);

  const [settings, setSettings] = useState<UserSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [usage, setUsage] = useState<UsageItem[]>([]);
  const [usageLoading, setUsageLoading] = useState(true);

  const preferredModel = settings.preferredModel ?? GEMINI_MODELS[0];
  const customPrompt = settings.customPrompt ?? "";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [settingsRes, usageRes] = await Promise.all([
          fetch("/api/user/settings"),
          fetch("/api/user/usage"),
        ]);
        if (cancelled) return;
        const settingsData = settingsRes.ok ? await settingsRes.json() : {};
        const usageData = usageRes.ok ? await usageRes.json() : { usage: [] };
        setSettings(settingsData.settings ?? {});
        setUsage(usageData.usage ?? []);
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
        setUsageLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* Load chat list once on mount so the sidebar shows previous chats */
  useEffect(() => {
    let cancelled = false;
    loadChats().then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [loadChats]);

  const saveSettings = async (next: UserSettings) => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error("Save failed");
      setSettings(next);
      setSaveMessage("Saved successfully");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setSaveMessage("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleModelChange = (model: string) => {
    const next = { ...settings, preferredModel: model };
    setSettings(next);
    saveSettings(next);
  };

  const handleCustomPromptChange = (value: string) => {
    const next = { ...settings, customPrompt: value };
    setSettings(next);
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch("/api/user", { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await authClient.signOut();
      router.push("/auth");
      router.refresh();
    } catch (err) {
      console.error("Failed to delete account:", err);
      setSaveMessage("Failed to delete account");
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AmbientBackground />

      <div className="hidden md:block shrink-0">
        <ChatSidebar />
      </div>

      {isMobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">
            <ChatSidebar />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="flex items-center justify-between w-full px-md h-xl bg-surface-container-low/3 backdrop-blur-2xl border-b border-outline-variant/20 z-20 shrink-0">
          <div className="flex items-center gap-sm">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden shrink-0 flex items-center justify-center h-9 w-9 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition"
              aria-label="Open menu"
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
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => router.push("/chats")}
              className="hidden sm:flex items-center gap-xs text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span className="text-body-md font-medium">Back to chat</span>
            </button>
          </div>

          <span className="text-headline-md font-headline-md tracking-tight text-on-surface">
            Settings
          </span>

          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-3xl space-y-6">
            {loading ? (
              <div className="space-y-4">
                <div className="h-40 rounded-2xl bg-surface-variant/20 animate-pulse" />
                <div className="h-64 rounded-2xl bg-surface-variant/20 animate-pulse" />
                <div className="h-48 rounded-2xl bg-surface-variant/20 animate-pulse" />
              </div>
            ) : (
              <>
                <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/10 backdrop-blur-xl p-6">
                  <h2 className="text-title-lg font-semibold text-on-surface mb-1">
                    Profile
                  </h2>
                  <p className="text-body-md text-on-surface-variant mb-6">
                    Your account information.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="text-label-sm text-on-surface-variant block mb-1">
                        Name
                      </label>
                      <div className="text-body-lg text-on-surface">{user.name}</div>
                    </div>
                    <div>
                      <label className="text-label-sm text-on-surface-variant block mb-1">
                        Email
                      </label>
                      <div className="text-body-lg text-on-surface">{user.email}</div>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/10 backdrop-blur-xl p-6">
                  <h2 className="text-title-lg font-semibold text-on-surface mb-1">
                    Models
                  </h2>
                  <p className="text-body-md text-on-surface-variant mb-6">
                    Choose your preferred Gemini model. It will be tried first before fallbacks.
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {GEMINI_MODELS.map((model) => {
                      const selected = model === preferredModel;
                      return (
                        <button
                          key={model}
                          onClick={() => handleModelChange(model)}
                          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                            selected
                              ? "border-primary bg-primary/10 text-on-surface"
                              : "border-outline-variant/30 bg-white/5 text-on-surface-variant hover:bg-white/10 hover:text-on-surface"
                          }`}
                        >
                          <span className="font-medium text-body-md">{model}</span>
                          {selected && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-on-primary">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={3}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/10 backdrop-blur-xl p-6">
                  <h2 className="text-title-lg font-semibold text-on-surface mb-1">
                    Usage
                  </h2>
                  <p className="text-body-md text-on-surface-variant mb-6">
                    Your model usage and remaining requests for this window.
                  </p>

                  {usageLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="h-16 rounded-xl bg-surface-variant/20 animate-pulse"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {GEMINI_MODELS.map((model) => {
                        const limits = MODEL_LIMITS[model];
                        const item = usage.find((u) => u.model === model);
                        const requestsUsedMinute = item?.requestsUsedMinute ?? 0;
                        const requestsUsedDay = item?.requestsUsedDay ?? 0;
                        const tokensUsedDay = item?.tokensUsedDay ?? 0;

                        const tpmRemaining = Math.max(0, limits.tpm - tokensUsedDay);
                        const tpmProgress = Math.min(
                          100,
                          Math.round((tokensUsedDay / limits.tpm) * 100)
                        );

                        return (
                          <div
                            key={model}
                            className="rounded-xl border border-outline-variant/20 bg-white/5 p-4"
                          >
                            <h3 className="text-title-md font-semibold text-on-surface mb-3">
                              {model}
                            </h3>

                            <div className="flex items-center justify-between mb-2">
                              <span className="text-label-sm text-on-surface-variant">
                                Estimated tokens remaining
                              </span>
                              <span className="text-label-sm text-on-surface-variant">
                                {tpmRemaining.toLocaleString()} / {limits.tpm.toLocaleString()}
                              </span>
                            </div>
                            <div className="h-3 w-full rounded-full bg-surface-variant/30 overflow-hidden mb-4">
                              <div
                                className="h-full rounded-full bg-linear-to-r from-emerald-400 to-primary transition-all"
                                style={{
                                  width: `${Math.max(0, 100 - tpmProgress)}%`,
                                }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
                              <span>
                                {requestsUsedMinute} / {limits.rpm} req per minute
                              </span>
                              <span>
                                {requestsUsedDay} / {limits.rpd} req per day
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/10 backdrop-blur-xl p-6">
                  <h2 className="text-title-lg font-semibold text-on-surface mb-1">
                    Preferences
                  </h2>
                  <p className="text-body-md text-on-surface-variant mb-6">
                    Add a custom system prompt that is inserted at the start of every chat prompt.
                  </p>

                  <div className="space-y-3">
                    <textarea
                      value={customPrompt}
                      onChange={(e) => handleCustomPromptChange(e.target.value)}
                      placeholder="e.g., Always answer concisely and cite sources when possible."
                      rows={5}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-on-surface placeholder:text-white/30 outline-none transition focus:border-primary/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/15 resize-none"
                    />
                    <div className="flex items-center justify-between gap-4">
                      {saveMessage && (
                        <span
                          className={`text-label-sm ${
                            saveMessage.includes("Failed")
                              ? "text-error"
                              : "text-emerald-400"
                          }`}
                        >
                          {saveMessage}
                        </span>
                      )}
                      <button
                        onClick={() => saveSettings({ ...settings, customPrompt })}
                        disabled={saving}
                        className="ml-auto rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary/90 transition disabled:opacity-60"
                      >
                        {saving ? "Saving..." : "Save preferences"}
                      </button>
                    </div>
                  </div>
                </section>

                <section className="mt-12 rounded-2xl border border-error/30 bg-error/5 backdrop-blur-xl p-6">
                  <h2 className="text-title-lg font-semibold text-error mb-1">
                    Danger zone
                  </h2>
                  <p className="text-body-md text-on-surface-variant mb-6">
                    Permanently delete your account and all associated data.
                  </p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="rounded-xl bg-error px-4 py-2 text-sm font-medium text-on-error hover:bg-error/90 transition"
                  >
                    Delete account
                  </button>
                </section>
              </>
            )}
          </div>
        </main>
      </div>

      {showDeleteModal &&
        createPortal(
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setShowDeleteModal(false)}
            />
            <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-surface-container-low/95 backdrop-blur-xl p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-on-surface mb-2">
                Delete your account?
              </h3>
              <p className="text-sm text-on-surface-variant mb-6">
                This action cannot be undone. All your chats, documents, messages, and account data will be permanently removed.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-error text-on-error hover:bg-error/90 transition-colors"
                >
                  Delete account
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
