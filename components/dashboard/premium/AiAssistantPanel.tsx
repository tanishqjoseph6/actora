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
  Pin,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Square,
  Trash2,
  Workflow,
  X,
} from "lucide-react";
import Link from "next/link";
import { dashboard } from "./dashboard-tokens";
import { RoxxThinkingIndicator } from "./RoxxThinkingIndicator";
import { RoxxModelSelector } from "./RoxxModelSelector";
import { RoxxAiCooldownScreen } from "./RoxxAiCooldownScreen";
import { AgentProgressTimeline, type AgentStep } from "@/components/dashboard/ai/AgentProgressTimeline";
import { RoxxVoiceControls } from "@/components/dashboard/ai/RoxxVoiceControls";
import { ProactiveInsightsCard } from "@/components/dashboard/ai/ProactiveInsightsCard";
import { usePlanGate, usePlanGateActions } from "@/components/subscription/PlanGateProvider";
import { useRoxxFairUsage } from "@/hooks/useRoxxFairUsage";
import type { RoxxFairUsageStatus } from "@/lib/assistant/fair-usage/types";
import { AiCreditsCard } from "@/components/subscription/AiCreditsCard";
import { formatLimit, type PlanId } from "@/lib/subscription";
import {
  defaultRoxxModelForPlan,
  normalizeRoxxModelId,
  planAllowsRoxxModel,
  type RoxxModelId,
} from "@/lib/assistant/models";
import {
  DEFAULT_SMART_SUGGESTIONS,
  ROXX_OS_COMMANDS,
  loadMemoryNotes,
  loadRoxxPreferences,
  togglePinnedCommand,
  type RoxxAiPreferences,
} from "@/lib/ai/roxx-preferences";

const STORAGE_KEY = "actora-assistant-conversations-v1";
const MODEL_STORAGE_KEY = "actora-roxx-model-v1";

const SUGGESTED_PROMPTS = [...ROXX_OS_COMMANDS];

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
  list_overdue_tasks: "Finding overdue tasks…",
  generate_weekly_report: "Generating weekly report…",
  run_stale_lead_followup: "Running follow-up agent…",
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
  | {
      type: "agent_step";
      step: string;
      status: "running" | "done" | "error";
      detail?: string;
    }
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

function loadSavedModel(planId: PlanId): RoxxModelId {
  if (typeof window === "undefined") return defaultRoxxModelForPlan(planId);
  try {
    const raw = localStorage.getItem(MODEL_STORAGE_KEY);
    const normalized = normalizeRoxxModelId(raw);
    if (normalized && planAllowsRoxxModel(planId, normalized)) {
      if (raw !== normalized) {
        localStorage.setItem(MODEL_STORAGE_KEY, normalized);
      }
      return normalized;
    }
  } catch {
    /* ignore */
  }
  return defaultRoxxModelForPlan(planId);
}

function saveSelectedModel(modelId: RoxxModelId) {
  try {
    localStorage.setItem(MODEL_STORAGE_KEY, modelId);
  } catch {
    /* ignore */
  }
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

export type AiAssistantPanelProps = {
  variant?: "embedded" | "drawer";
  pendingPrompt?: string | null;
  onPendingPromptConsumed?: () => void;
  onClose?: () => void;
};

export function AiAssistantPanel({
  variant = "embedded",
  pendingPrompt = null,
  onPendingPromptConsumed,
  onClose,
}: AiAssistantPanelProps = {}) {
  const { checkAiAction, showLimitModal, refreshSubscription } =
    usePlanGateActions();
  const { subscription, loading: planLoading } = usePlanGate();
  const {
    status: fairUsage,
    blocked: fairUsageBlocked,
    refresh: refreshFairUsage,
  } = useRoxxFairUsage({ enabled: !planLoading });
  const planId = (subscription?.planId ?? "free") as PlanId;
  const [selectedModel, setSelectedModel] = useState<RoxxModelId>("gpt-4o-mini");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [prefs, setPrefs] = useState<RoxxAiPreferences>(() =>
    typeof window === "undefined"
      ? {
          responseStyle: "balanced",
          creativity: "balanced",
          language: "en",
          voiceEnabled: true,
          voiceAutoSpeak: false,
          proactiveNotifications: true,
          agentModeDefault: false,
        }
      : loadRoxxPreferences()
  );
  const [agentMode, setAgentMode] = useState(false);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const messagesRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);
  const selectedModelRef = useRef<RoxxModelId>(selectedModel);
  const agentModeRef = useRef(agentMode);
  const prefsRef = useRef(prefs);

  useEffect(() => {
    selectedModelRef.current = selectedModel;
  }, [selectedModel]);

  useEffect(() => {
    agentModeRef.current = agentMode;
  }, [agentMode]);

  useEffect(() => {
    prefsRef.current = prefs;
  }, [prefs]);

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const messages = active?.messages ?? [];

  useEffect(() => {
    const items = loadConversations();
    setConversations(items);
    if (items[0]) setActiveId(items[0].id);
    const loadedPrefs = loadRoxxPreferences();
    setPrefs(loadedPrefs);
    setAgentMode(loadedPrefs.agentModeDefault);
    setBootstrapped(true);
  }, []);

  useEffect(() => {
    if (planLoading) return;
    const allowed = loadSavedModel(planId);
    setSelectedModel(allowed);
  }, [planId, planLoading]);

  useEffect(() => {
    if (!planAllowsRoxxModel(planId, selectedModel)) {
      const fallback = defaultRoxxModelForPlan(planId);
      setSelectedModel(fallback);
      saveSelectedModel(fallback);
    }
  }, [planId, selectedModel]);

  useEffect(() => {
    if (variant === "drawer") return;
    const previous = document.title;
    document.title = "Roxx AI | Actora";
    return () => {
      document.title = previous;
    };
  }, [variant]);

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
    async (
      history: UiMessage[],
      conversationId: string,
      title: string,
      options?: { regenerate?: boolean }
    ) => {
      if (fairUsageBlocked) return;
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
      setAgentSteps([]);
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

      let streamed = "";

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
            model: selectedModelRef.current,
            regenerate: Boolean(options?.regenerate),
            agentMode: agentModeRef.current,
            preferences: prefsRef.current,
            memoryNotes: loadMemoryNotes(),
          }),
        });

        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as {
            error?: string;
            code?: string;
            limitType?: "ai_actions" | "inboxes" | "feature";
            recommendedPlan?: PlanId;
            fairUsage?: RoxxFairUsageStatus;
          };
          if (err.code === "FAIR_USAGE_COOLDOWN") {
            void refreshFairUsage();
            patchAssistant({
              content: "",
              toolStatus: null,
            });
            setConversations((prev) =>
              prev.map((c) => {
                if (c.id !== conversationId) return c;
                return {
                  ...c,
                  messages: c.messages.filter((m) => m.id !== assistantId),
                };
              })
            );
            return;
          }
          if (err.code === "PLAN_LIMIT" && err.limitType) {
            showLimitModal(
              err.error || "AI limit reached",
              err.limitType,
              err.recommendedPlan
            );
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
              streamed += event.text;
              patchAssistant({ content: streamed, toolStatus: null });
            } else if (event.type === "tool_start") {
              patchAssistant({
                toolStatus:
                  TOOL_LABELS[event.name] ?? `Running ${event.name}…`,
              });
            } else if (event.type === "tool_result") {
              patchAssistant({ toolStatus: null });
            } else if (event.type === "agent_step") {
              setAgentSteps((prev) => {
                const existing = prev.findIndex(
                  (s) => s.step === event.step && s.status === "running"
                );
                const nextStep: AgentStep = {
                  id: `${event.step}-${Date.now()}-${Math.random()}`,
                  step: event.step,
                  status: event.status,
                  detail: event.detail,
                };
                if (existing >= 0) {
                  const copy = [...prev];
                  copy[existing] = {
                    ...copy[existing],
                    status: event.status,
                    detail: event.detail ?? copy[existing].detail,
                  };
                  return copy;
                }
                return [...prev, nextStep].slice(-12);
              });
            } else if (event.type === "done") {
              streamed = event.content || streamed;
              patchAssistant({ content: streamed, toolStatus: null });
            } else if (event.type === "error") {
              patchAssistant({
                content: event.message || "Assistant error.",
                toolStatus: null,
              });
            }
          }
        }

        void refreshSubscription();
        void refreshFairUsage();
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          patchAssistant({
            content: streamed || "Generation stopped.",
            toolStatus: null,
          });
          return;
        }
        patchAssistant({
          content:
            error instanceof Error
              ? error.message
              : "Failed to reach Roxx AI.",
          toolStatus: null,
        });
      } finally {
        setStreaming(false);
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    },
    [checkAiAction, fairUsageBlocked, refreshFairUsage, refreshSubscription, showLimitModal, upsertConversation]
  );

  const sendPrompt = useCallback(
    async (text: string) => {
      const prompt = text.trim();
      if (!prompt || streaming || fairUsageBlocked) return;

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
    [activeId, conversations, fairUsageBlocked, runChat, streaming, upsertConversation]
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
    if (!active || streaming || fairUsageBlocked) return;
    const lastUserIdx = [...active.messages]
      .map((m, i) => ({ m, i }))
      .reverse()
      .find((x) => x.m.role === "user")?.i;
    if (lastUserIdx == null) return;
    const history = active.messages.slice(0, lastUserIdx + 1);
    await runChat(history, active.id, active.title, { regenerate: true });
  };

  const stopGeneration = () => {
    abortRef.current?.abort();
  };

  const runSmartAction = (prompt: string) => {
    if (streaming || fairUsageBlocked) return;
    void sendPrompt(prompt);
  };

  useEffect(() => {
    if (!pendingPrompt || !bootstrapped || streaming) return;
    void sendPrompt(pendingPrompt);
    onPendingPromptConsumed?.();
  }, [pendingPrompt, bootstrapped]); // eslint-disable-line react-hooks/exhaustive-deps -- fire once per pending prompt

  const lastAssistant = [...messages]
    .reverse()
    .find((m) => m.role === "assistant" && m.content);

  const isDrawer = variant === "drawer";

  return (
    <>
    {!isDrawer && (
    <div className="mb-4 lg:hidden">
      <AiCreditsCard
        subscription={subscription}
        loading={planLoading}
        compact
        detailed
      />
    </div>
    )}
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28 }}
      className={
        isDrawer
          ? "flex h-full min-h-0 flex-col overflow-hidden"
          : `${dashboard.cardLg} mb-8 overflow-hidden lg:mb-10`
      }
    >
      {!isDrawer && (
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
          {subscription && (
            <p className="mt-1.5 text-[11px] tabular-nums text-[#71717A]">
              {subscription.usage.aiCreditsRemaining != null &&
              Number.isFinite(subscription.usage.aiCreditsRemaining)
                ? `${subscription.usage.aiCreditsRemaining.toLocaleString("en-IN")} / ${formatLimit(
                    subscription.usage.aiCreditsAllotment ??
                      subscription.limits.aiActionsPerMonth
                  )} AI credits left`
                : `${formatLimit(subscription.limits.aiActionsPerMonth)} AI credits / cycle`}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <RoxxModelSelector
            planId={planId}
            value={selectedModel}
            disabled={streaming}
            onChange={(modelId) => {
              setSelectedModel(modelId);
              saveSelectedModel(modelId);
            }}
            onLockedSelect={(_modelId, upgradePlan) => {
              showLimitModal(
                "This model isn’t included in your plan. Upgrade to unlock it in Roxx AI.",
                "feature",
                upgradePlan
              );
            }}
          />
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
      )}

      {isDrawer && (
        <div className="flex shrink-0 items-center justify-end gap-1.5 border-b border-white/[0.06] px-3 py-2">
          <RoxxModelSelector
            planId={planId}
            value={selectedModel}
            disabled={streaming}
            onChange={(modelId) => {
              setSelectedModel(modelId);
              saveSelectedModel(modelId);
            }}
            onLockedSelect={(_modelId, upgradePlan) => {
              showLimitModal(
                "This model isn’t included in your plan. Upgrade to unlock it in Roxx AI.",
                "feature",
                upgradePlan
              );
            }}
          />
          <button
            type="button"
            onClick={() => setHistoryOpen((v) => !v)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-[#71717A] hover:text-white"
            aria-label="Conversation history"
          >
            <History className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={startNewChat}
            disabled={streaming}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/[0.08] px-2 text-[11px] text-[#71717A] hover:text-white disabled:opacity-50"
          >
            <Plus className="h-3 w-3" />
            New
          </button>
        </div>
      )}

      {/* Fixed chat viewport: only the message list scrolls; page scroll stays stable. */}
      <div
        className={
          isDrawer
            ? "relative flex min-h-0 flex-1 flex-col"
            : "relative flex h-[min(520px,70vh)] min-h-[400px] flex-col sm:h-[min(560px,72vh)]"
        }
      >
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
            <div className="flex min-h-full flex-col justify-center py-4">
              {prefs.proactiveNotifications && (
                <ProactiveInsightsCard compact={isDrawer} />
              )}
              <p className="mb-1 text-center text-sm font-medium text-white">
                Roxx AI Operating System
              </p>
              <p className="mb-4 text-center text-sm text-[#A1A1AA]">
                Where conversations become execution. Control tasks, CRM,
                calendar, inbox, and automations in natural language.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED_PROMPTS.slice(0, isDrawer ? 6 : 10).map(
                  (prompt, index) => (
                    <motion.button
                      key={prompt}
                      type="button"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.05 + index * 0.03 }}
                      disabled={streaming || fairUsageBlocked}
                      onClick={() => {
                        stickToBottomRef.current = true;
                        void sendPrompt(prompt);
                      }}
                      className="inline-flex rounded-xl border border-white/[0.08] bg-[#0A0A0A] px-3 py-2 text-left text-xs text-[#A1A1AA] transition-all hover:-translate-y-0.5 hover:border-[#3B82F6]/35 hover:text-white disabled:opacity-50"
                    >
                      {prompt}
                    </motion.button>
                  )
                )}
              </div>
            </div>
          )}

          {agentSteps.length > 0 && (
            <div className="px-1">
              <AgentProgressTimeline steps={agentSteps} />
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
                      <div className="mt-2 space-y-2 border-t border-white/[0.06] pt-2">
                        <div className="flex flex-wrap items-center gap-1">
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
                        {lastAssistant?.id === m.id && (
                          <div className="flex flex-wrap gap-1">
                            {DEFAULT_SMART_SUGGESTIONS.map((action) =>
                              action.href ? (
                                <Link
                                  key={action.id}
                                  href={action.href}
                                  className="rounded-lg border border-white/[0.06] px-2 py-1 text-[10px] text-[#71717A] transition-colors hover:border-[#3B82F6]/30 hover:text-white"
                                >
                                  {action.label}
                                </Link>
                              ) : (
                                <button
                                  key={action.id}
                                  type="button"
                                  onClick={() =>
                                    action.prompt && runSmartAction(action.prompt)
                                  }
                                  className="rounded-lg border border-white/[0.06] px-2 py-1 text-[10px] text-[#71717A] transition-colors hover:border-[#3B82F6]/30 hover:text-white"
                                >
                                  {action.label}
                                </button>
                              )
                            )}
                            <button
                              type="button"
                              onClick={() => togglePinnedCommand(m.content.slice(0, 80))}
                              className="inline-flex items-center gap-1 rounded-lg border border-white/[0.06] px-2 py-1 text-[10px] text-[#71717A] transition-colors hover:border-[#3B82F6]/30 hover:text-white"
                              title="Pin last answer as command"
                            >
                              <Pin className="h-3 w-3" />
                              Pin
                            </button>
                          </div>
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

        <AnimatePresence>
          {fairUsageBlocked && !fairUsage.unlimited ? (
            <RoxxAiCooldownScreen status={fairUsage} />
          ) : null}
        </AnimatePresence>

        <form
          onSubmit={(e) => {
            stickToBottomRef.current = true;
            onSubmit(e);
          }}
          className="relative shrink-0 border-t border-white/[0.06] bg-[#111111] p-4 sm:px-6 sm:pb-5"
        >
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAgentMode((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] transition-colors ${
                agentMode
                  ? "border-[#3B82F6]/40 bg-[#3B82F6]/15 text-[#93C5FD]"
                  : "border-white/[0.08] text-[#71717A] hover:text-white"
              }`}
              aria-pressed={agentMode}
            >
              <Workflow className="h-3 w-3" />
              Agent mode
            </button>
            <span className="text-[10px] text-[#52525B]">
              {agentMode
                ? "Multi-step workflows execute automatically"
                : "⌘K for commands · Hold mic to talk"}
            </span>
          </div>
          <div
            className={`flex items-end gap-2 rounded-2xl border border-white/[0.08] bg-[#0A0A0A] p-2 focus-within:border-[#3B82F6]/40 ${
              fairUsageBlocked ? "pointer-events-none opacity-40" : ""
            }`}
          >
            {prefs.voiceEnabled && (
              <RoxxVoiceControls
                disabled={streaming || fairUsageBlocked}
                language={prefs.language === "en" ? "en-US" : prefs.language}
                autoSpeak={prefs.voiceAutoSpeak}
                lastAssistantText={
                  !streaming && lastAssistant?.content
                    ? lastAssistant.content
                    : null
                }
                onTranscript={(text) => setInput(text)}
                onFinalTranscript={(text) => {
                  setInput(text);
                  stickToBottomRef.current = true;
                  void sendPrompt(text);
                }}
              />
            )}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder={
                fairUsageBlocked
                  ? "Roxx AI cooldown active…"
                  : "Ask Roxx to run your workspace…"
              }
              disabled={streaming || fairUsageBlocked}
              className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-white placeholder:text-[#71717A] focus:outline-none disabled:opacity-60"
            />
            {streaming ? (
              <button
                type="button"
                onClick={stopGeneration}
                className={`${dashboard.btnSecondary} h-10 w-10 shrink-0`}
                aria-label="Stop generation"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={fairUsageBlocked || !input.trim()}
                className={`${dashboard.btnPrimary} h-10 w-10 shrink-0 disabled:cursor-not-allowed disabled:opacity-40`}
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="mt-2 text-[10px] text-[#52525B]">
            Enter to send · Shift+Enter new line · Esc / stop to cancel
          </p>
        </form>
      </div>
    </motion.section>
    </>
  );
}
