"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Check,
  Copy,
  History,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { dashboard } from "./dashboard-tokens";
import { RoxxThinkingIndicator } from "./RoxxThinkingIndicator";
import { usePlanGateActions } from "@/components/subscription/PlanGateProvider";

const STORAGE_KEY = "actora-assistant-conversations-v1";

const SUGGESTED_PROMPTS = [
  "Summarize today's emails",
  "Find important emails",
  "Explain my pipeline status",
  "Suggest follow-ups for this week",
  "Create a task from my unread inbox",
  "Draft a reply to my latest email",
];

const TOOL_LABELS: Record<string, string> = {
  get_important_emails: "Finding important emails…",
  summarize_todays_emails: "Summarizing today's emails…",
  explain_pipeline: "Checking pipeline…",
  suggest_followups: "Suggesting follow-ups…",
  search_workspace: "Searching workspace…",
  create_task: "Creating task…",
  create_crm_contact: "Creating CRM contact…",
  create_deal: "Creating deal…",
  schedule_meeting: "Scheduling meeting…",
  generate_email_reply: "Drafting email reply…",
  create_automation: "Creating automation…",
};

type Role = "user" | "assistant";

type UiMessage = {
  id: string;
  role: Role;
  content: string;
  toolStatus?: string | null;
};

type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
  messages: UiMessage[];
};

type StreamEvent =
  | { type: "token"; text: string }
  | { type: "tool_start"; name: string }
  | { type: "tool_result"; name: string; result: Record<string, unknown> }
  | { type: "done"; content: string }
  | { type: "error"; message: string };

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function titleFromPrompt(text: string) {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length > 48 ? `${t.slice(0, 48)}…` : t || "New chat";
}

function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Conversation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveConversations(items: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 40)));
}

function renderMarkdownLite(text: string) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const inner = part.replace(/^```\w*\n?/, "").replace(/```$/, "");
      return (
        <pre
          key={i}
          className="my-2 overflow-x-auto rounded-xl border border-white/[0.08] bg-[#0A0A0A] p-3 text-[12px] leading-relaxed text-[#E4E4E7]"
        >
          {inner}
        </pre>
      );
    }
    return (
      <span key={i} className="whitespace-pre-wrap">
        {part}
      </span>
    );
  });
}

export function AiAssistantPanel() {
  const { checkAiAction, showLimitModal, refreshSubscription } =
    usePlanGateActions();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const messages = active?.messages ?? [];

  useEffect(() => {
    const items = loadConversations();
    setConversations(items);
    if (items[0]) setActiveId(items[0].id);
    setBootstrapped(true);
  }, []);

  useEffect(() => {
    const previous = document.title;
    document.title = "Roxx AI | Actora";
    return () => {
      document.title = previous;
    };
  }, []);

  useEffect(() => {
    if (!bootstrapped) return;
    saveConversations(conversations);
  }, [conversations, bootstrapped]);

  /** Scroll only the chat message pane — never the page / dashboard shell. */
  const scrollMessagesToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const onMessagesScroll = useCallback(() => {
    const el = messagesRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 80;
  }, []);

  useEffect(() => {
    if (!stickToBottomRef.current) return;
    // rAF keeps this off the critical path and avoids layout thrash while streaming.
    const id = requestAnimationFrame(() => scrollMessagesToBottom("auto"));
    return () => cancelAnimationFrame(id);
  }, [messages, streaming, scrollMessagesToBottom]);

  const upsertConversation = useCallback(
    (next: Conversation) => {
      setConversations((prev) => {
        const others = prev.filter((c) => c.id !== next.id);
        return [next, ...others];
      });
      setActiveId(next.id);
    },
    []
  );

  const startNewChat = useCallback(() => {
    if (streaming) return;
    stickToBottomRef.current = true;
    setActiveId(null);
    setInput("");
    setHistoryOpen(false);
  }, [streaming]);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) setActiveId(null);
    },
    [activeId]
  );

  const runChat = useCallback(
    async (history: UiMessage[], conversationId: string, title: string) => {
      if (!checkAiAction()) return;

      const assistantId = uid();
      const withAssistant: UiMessage[] = [
        ...history,
        { id: assistantId, role: "assistant", content: "", toolStatus: null },
      ];

      upsertConversation({
        id: conversationId,
        title,
        updatedAt: new Date().toISOString(),
        messages: withAssistant,
      });

      setStreaming(true);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const patchAssistant = (patch: Partial<UiMessage>) => {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== conversationId) return c;
            return {
              ...c,
              updatedAt: new Date().toISOString(),
              messages: c.messages.map((m) =>
                m.id === assistantId ? { ...m, ...patch } : m
              ),
            };
          })
        );
      };

      try {
        const res = await fetch("/api/assistant/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            messages: history.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as {
            error?: string;
            code?: string;
            limitType?: "ai_actions" | "inboxes" | "feature";
          };
          if (err.code === "PLAN_LIMIT" && err.limitType) {
            showLimitModal(err.error || "AI limit reached", err.limitType);
          }
          patchAssistant({
            content: err.error || "Something went wrong. Please try again.",
            toolStatus: null,
          });
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          patchAssistant({ content: "No response stream.", toolStatus: null });
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let full = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";

          for (const chunk of chunks) {
            const line = chunk
              .split("\n")
              .map((l) => l.trim())
              .find((l) => l.startsWith("data:"));
            if (!line) continue;
            const raw = line.replace(/^data:\s*/, "");
            if (!raw || raw === "[DONE]") continue;
            let event: StreamEvent;
            try {
              event = JSON.parse(raw) as StreamEvent;
            } catch {
              continue;
            }

            if (event.type === "token") {
              full += event.text;
              patchAssistant({ content: full, toolStatus: null });
            } else if (event.type === "tool_start") {
              patchAssistant({
                toolStatus:
                  TOOL_LABELS[event.name] ?? `Running ${event.name}…`,
              });
            } else if (event.type === "tool_result") {
              patchAssistant({ toolStatus: null });
            } else if (event.type === "done") {
              full = event.content || full;
              patchAssistant({ content: full, toolStatus: null });
            } else if (event.type === "error") {
              patchAssistant({
                content: event.message || "Assistant error.",
                toolStatus: null,
              });
            }
          }
        }

        void refreshSubscription();
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        patchAssistant({
          content:
            error instanceof Error
              ? error.message
              : "Failed to reach Roxx AI.",
          toolStatus: null,
        });
      } finally {
        setStreaming(false);
      }
    },
    [checkAiAction, refreshSubscription, showLimitModal, upsertConversation]
  );

  const sendPrompt = useCallback(
    async (text: string) => {
      const prompt = text.trim();
      if (!prompt || streaming) return;

      const conversationId = activeId ?? uid();
      const existing = conversations.find((c) => c.id === conversationId);
      const userMsg: UiMessage = { id: uid(), role: "user", content: prompt };
      const history = [...(existing?.messages ?? []), userMsg];
      const title = existing?.title || titleFromPrompt(prompt);

      setInput("");
      upsertConversation({
        id: conversationId,
        title,
        updatedAt: new Date().toISOString(),
        messages: history,
      });

      await runChat(history, conversationId, title);
    },
    [activeId, conversations, runChat, streaming, upsertConversation]
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendPrompt(input);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendPrompt(input);
    }
  };

  const copyMessage = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* ignore */
    }
  };

  const regenerate = async () => {
    if (!active || streaming) return;
    const lastUserIdx = [...active.messages]
      .map((m, i) => ({ m, i }))
      .reverse()
      .find((x) => x.m.role === "user")?.i;
    if (lastUserIdx == null) return;
    const history = active.messages.slice(0, lastUserIdx + 1);
    await runChat(history, active.id, active.title);
  };

  const lastAssistant = [...messages]
    .reverse()
    .find((m) => m.role === "assistant" && m.content);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28 }}
      className={`${dashboard.cardLg} mb-8 overflow-hidden lg:mb-10`}
    >
      <div className="flex items-start gap-3 border-b border-white/[0.06] p-5 sm:p-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/15 text-[#3B82F6]">
          <Bot className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Roxx AI</h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-2 py-0.5 text-[10px] font-medium text-[#93C5FD]">
              <Sparkles className="h-3 w-3" />
              {streaming ? "Roxx AI is thinking…" : "Online"}
            </span>
          </div>
          <p className="mt-1 text-sm text-[#A1A1AA]">
            Your AI teammate for Inbox, CRM, Calendar, Tasks & Automations.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setHistoryOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] text-[#A1A1AA] transition-colors hover:border-[#3B82F6]/35 hover:text-white"
            aria-label="Conversation history"
            title="History"
          >
            <History className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={startNewChat}
            disabled={streaming}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] px-3 text-xs text-[#A1A1AA] transition-colors hover:border-[#3B82F6]/35 hover:text-white disabled:opacity-50"
            title="New chat"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </button>
        </div>
      </div>

      {/* Fixed chat viewport: only the message list scrolls; page scroll stays stable. */}
      <div className="relative flex h-[min(520px,70vh)] min-h-[400px] flex-col sm:h-[min(560px,72vh)]">
        <AnimatePresence>
          {historyOpen && (
            <motion.aside
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="absolute inset-y-0 left-0 z-20 w-[min(100%,280px)] border-r border-white/[0.06] bg-[#0F0F0F] p-3 shadow-xl"
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-xs font-medium text-white">History</p>
                <button
                  type="button"
                  onClick={() => setHistoryOpen(false)}
                  className="rounded-lg p-1 text-[#71717A] hover:text-white"
                  aria-label="Close history"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="h-[calc(100%-2rem)] space-y-1 overflow-y-auto overscroll-contain">
                {conversations.length === 0 && (
                  <p className="px-2 py-6 text-center text-xs text-[#71717A]">
                    No conversations yet
                  </p>
                )}
                {conversations.map((c) => (
                  <div
                    key={c.id}
                    className={`group flex items-center gap-1 rounded-xl border px-2 py-2 ${
                      c.id === activeId
                        ? "border-[#3B82F6]/35 bg-[#3B82F6]/10"
                        : "border-transparent hover:border-white/[0.08] hover:bg-white/[0.03]"
                    }`}
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => {
                        stickToBottomRef.current = true;
                        setActiveId(c.id);
                        setHistoryOpen(false);
                      }}
                    >
                      <p className="truncate text-xs text-white">{c.title}</p>
                      <p className="text-[10px] text-[#71717A]">
                        {new Date(c.updatedAt).toLocaleString()}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteConversation(c.id)}
                      className="rounded-lg p-1 text-[#71717A] opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <div
          ref={messagesRef}
          onScroll={onMessagesScroll}
          className="premium-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6"
        >
          {messages.length === 0 && (
            <div className="flex min-h-full flex-col justify-center py-6">
              <p className="mb-4 text-center text-sm text-[#A1A1AA]">
                Where conversations become execution. Ask Roxx AI to triage
                inbox, update CRM, schedule meetings, or create tasks.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED_PROMPTS.map((prompt, index) => (
                  <motion.button
                    key={prompt}
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.05 + index * 0.04 }}
                    disabled={streaming}
                    onClick={() => {
                      stickToBottomRef.current = true;
                      void sendPrompt(prompt);
                    }}
                    className="inline-flex rounded-xl border border-white/[0.08] bg-[#0A0A0A] px-3 py-2 text-left text-xs text-[#A1A1AA] transition-all hover:-translate-y-0.5 hover:border-[#3B82F6]/35 hover:text-white disabled:opacity-50"
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[92%] sm:max-w-[85%] ${
                  m.role === "user"
                    ? "rounded-2xl rounded-br-md bg-[#3B82F6] px-3.5 py-2.5 text-sm text-white"
                    : "rounded-2xl rounded-bl-md border border-white/[0.08] bg-[#0A0A0A] px-3.5 py-2.5 text-sm text-[#E4E4E7]"
                }`}
              >
                {m.role === "assistant" ? (
                  <>
                    <AnimatePresence mode="popLayout" initial={false}>
                      {streaming && !m.content ? (
                        <motion.div
                          key="roxx-thinking"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          className="min-h-[28px]"
                        >
                          <RoxxThinkingIndicator status={m.toolStatus} />
                        </motion.div>
                      ) : null}
                    </AnimatePresence>

                    {m.content ? (
                      <div className="min-h-[1.25rem] leading-relaxed">
                        {renderMarkdownLite(m.content)}
                      </div>
                    ) : streaming ? null : (
                      <div className="min-h-[1.25rem]" aria-hidden />
                    )}

                    {m.content && !streaming && (
                      <div className="mt-2 flex items-center gap-1 border-t border-white/[0.06] pt-2">
                        <button
                          type="button"
                          onClick={() => void copyMessage(m.id, m.content)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-[#71717A] hover:bg-white/[0.04] hover:text-white"
                        >
                          {copiedId === m.id ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          {copiedId === m.id ? "Copied" : "Copy"}
                        </button>
                        {lastAssistant?.id === m.id && (
                          <button
                            type="button"
                            onClick={() => void regenerate()}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-[#71717A] hover:bg-white/[0.04] hover:text-white"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Regenerate
                          </button>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            stickToBottomRef.current = true;
            onSubmit(e);
          }}
          className="shrink-0 border-t border-white/[0.06] bg-[#111111] p-4 sm:px-6 sm:pb-5"
        >
          <div className="flex items-end gap-2 rounded-2xl border border-white/[0.08] bg-[#0A0A0A] p-2 focus-within:border-[#3B82F6]/40">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder="Ask Roxx AI anything…"
              disabled={streaming}
              className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-white placeholder:text-[#71717A] focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className={`${dashboard.btnPrimary} h-10 w-10 shrink-0 disabled:cursor-not-allowed disabled:opacity-40`}
              aria-label="Send"
            >
              {streaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="mt-2 text-[10px] text-[#52525B]">
            Enter to send · Shift+Enter for new line
          </p>
        </form>
      </div>
    </motion.section>
  );
}
