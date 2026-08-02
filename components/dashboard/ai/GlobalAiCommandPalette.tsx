"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Building2,
  Calendar,
  Clock,
  Handshake,
  Inbox,
  Kanban,
  ListTodo,
  Loader2,
  Pin,
  Search,
  Settings,
  Sparkles,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { fetchJson } from "@/lib/api/fetch-json";
import {
  filterPromptSuggestions,
  ROXX_EXAMPLE_PROMPTS,
} from "@/lib/ai/roxx-config";
import {
  loadPromptHistory,
  type PromptHistoryEntry,
} from "@/lib/ai/prompt-history";
import {
  loadPinnedCommands,
  ROXX_OS_COMMANDS,
  togglePinnedCommand,
} from "@/lib/ai/roxx-preferences";
import type { GlobalSearchCategory, GlobalSearchResult } from "@/lib/search/types";
import { useRoxx } from "@/providers/RoxxProvider";
import { cn } from "@/lib/utils";

const RECENT_SEARCHES_KEY = "actora_recent_searches_v1";
const MAX_RECENT = 8;

type PaletteMode = "ai" | "search";

type SearchItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  category: string;
  icon: LucideIcon;
  keywords: string[];
};

type RecentSearch = {
  query: string;
  at: string;
};

const CATEGORY_ICONS: Record<GlobalSearchCategory, LucideIcon> = {
  Emails: Inbox,
  Contacts: Kanban,
  Companies: Building2,
  Deals: Handshake,
  Tasks: ListTodo,
  Meetings: Calendar,
  Automations: Workflow,
};

const NAV_INDEX: SearchItem[] = [
  {
    id: "inbox",
    label: "AI Inbox",
    description: "Emails, summaries, and smart replies",
    href: "/dashboard/inbox",
    category: "Emails",
    icon: Inbox,
    keywords: ["email", "gmail", "mail", "reply"],
  },
  {
    id: "contacts",
    label: "Contacts",
    description: "Browse and manage CRM contacts",
    href: "/dashboard/crm/contacts",
    category: "Contacts",
    icon: Kanban,
    keywords: ["people", "leads", "crm"],
  },
  {
    id: "tasks",
    label: "Tasks",
    description: "AI-generated and manual tasks",
    href: "/dashboard/tasks",
    category: "Tasks",
    icon: ListTodo,
    keywords: ["todo", "action"],
  },
  {
    id: "calendar",
    label: "Calendar",
    description: "Meetings and schedule",
    href: "/dashboard/calendar",
    category: "Meetings",
    icon: Calendar,
    keywords: ["calendar", "schedule", "meetings"],
  },
  {
    id: "automations",
    label: "Automations",
    description: "Workflows and execution history",
    href: "/dashboard/automations",
    category: "Automations",
    icon: Workflow,
    keywords: ["workflow", "automation"],
  },
  {
    id: "assistant",
    label: "Roxx AI",
    description: "Your AI workspace copilot",
    href: "/dashboard",
    category: "Roxx AI",
    icon: Bot,
    keywords: ["assistant", "ai", "home", "roxx"],
  },
  {
    id: "settings",
    label: "Settings",
    description: "Workspace, profile, and integrations",
    href: "/dashboard/settings",
    category: "Settings",
    icon: Settings,
    keywords: ["profile", "security", "preferences"],
  },
];

function loadRecentSearches(): RecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentSearch[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;
  const existing = loadRecentSearches().filter(
    (item) => item.query.toLowerCase() !== trimmed.toLowerCase()
  );
  const next = [{ query: trimmed, at: new Date().toISOString() }, ...existing].slice(
    0,
    MAX_RECENT
  );
  window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
}

function filterNavItems(query: string): SearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return NAV_INDEX.slice(0, 6);
  return NAV_INDEX.filter((item) => {
    const haystack = [item.label, item.description, item.category, ...item.keywords]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  }).slice(0, 6);
}

function toSearchItem(result: GlobalSearchResult): SearchItem {
  return {
    id: result.id,
    label: result.label,
    description: result.description,
    href: result.href,
    category: result.category,
    icon: CATEGORY_ICONS[result.category] ?? Search,
    keywords: [],
  };
}

type GlobalAiCommandPaletteProps = {
  open: boolean;
  onClose: () => void;
};

export function GlobalAiCommandPalette({
  open,
  onClose,
}: GlobalAiCommandPaletteProps) {
  const router = useRouter();
  const { askRoxx, openCopilot } = useRoxx();
  const [mode, setMode] = useState<PaletteMode>("ai");
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [remoteResults, setRemoteResults] = useState<SearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [promptHistory, setPromptHistory] = useState<PromptHistoryEntry[]>([]);
  const [pinned, setPinned] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setRecentSearches(loadRecentSearches());
    setPromptHistory(loadPromptHistory());
    setPinned(loadPinnedCommands());
    setQuery("");
    setMode("ai");
    setActiveIndex(0);
  }, [open]);

  const trimmedQuery = query.trim();

  useEffect(() => {
    if (mode !== "search" || !trimmedQuery) {
      setRemoteResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = window.setTimeout(() => {
      void (async () => {
        const result = await fetchJson<{ results: GlobalSearchResult[] }>(
          `/api/search?q=${encodeURIComponent(trimmedQuery)}`
        );
        setSearching(false);
        if (result.ok) {
          setRemoteResults(result.data.results.map(toSearchItem));
        } else {
          setRemoteResults([]);
        }
      })();
    }, 180);

    return () => window.clearTimeout(timer);
  }, [mode, trimmedQuery]);

  const aiSuggestions = useMemo(
    () => filterPromptSuggestions(trimmedQuery),
    [trimmedQuery]
  );

  const searchResults = useMemo(() => {
    if (mode !== "search") return [];
    if (trimmedQuery) {
      if (remoteResults.length > 0) return remoteResults;
      return filterNavItems(trimmedQuery);
    }
    return filterNavItems("");
  }, [mode, trimmedQuery, remoteResults]);

  const listItems = useMemo(() => {
    if (mode === "ai") {
      if (trimmedQuery) {
        const osMatches = ROXX_OS_COMMANDS.filter((p) =>
          p.toLowerCase().includes(trimmedQuery.toLowerCase())
        );
        const merged = [...new Set([...osMatches, ...aiSuggestions])];
        return merged.map((prompt, i) => ({
          id: `ai-${i}`,
          type: "ai" as const,
          label: prompt,
          icon: Sparkles,
        }));
      }
      const pinnedItems = pinned.slice(0, 6).map((prompt, i) => ({
        id: `pinned-${i}`,
        type: "pinned" as const,
        label: prompt,
        icon: Sparkles,
      }));
      const history = promptHistory.slice(0, 4).map((entry, i) => ({
        id: `history-${i}`,
        type: "history" as const,
        label: entry.prompt,
        icon: Clock,
      }));
      const examples = [
        ...ROXX_OS_COMMANDS.slice(0, 4),
        ...ROXX_EXAMPLE_PROMPTS.slice(0, 3),
      ].map((prompt, i) => ({
        id: `example-${i}`,
        type: "example" as const,
        label: prompt,
        icon: Sparkles,
      }));
      return [...pinnedItems, ...history, ...examples];
    }
    return searchResults.map((item) => ({
      id: item.id,
      type: "search" as const,
      label: item.label,
      description: item.description,
      category: item.category,
      href: item.href,
      icon: item.icon,
    }));
  }, [mode, trimmedQuery, aiSuggestions, promptHistory, pinned, searchResults]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, mode, open, listItems.length]);

  const goTo = useCallback(
    (href: string, searchTerm?: string) => {
      if (searchTerm) saveRecentSearch(searchTerm);
      onClose();
      router.push(href, { scroll: false });
    },
    [onClose, router]
  );

  const submitAi = useCallback(
    (prompt: string) => {
      askRoxx(prompt);
    },
    [askRoxx]
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "Tab") {
        event.preventDefault();
        setMode((m) => (m === "ai" ? "search" : "ai"));
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(listItems.length - 1, 0)));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const item = listItems[activeIndex];
        if (mode === "ai") {
          const prompt = item?.label ?? trimmedQuery;
          if (prompt) submitAi(prompt);
          return;
        }
        if (item && "href" in item && item.href) {
          goTo(item.href, trimmedQuery || undefined);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    open,
    listItems,
    activeIndex,
    mode,
    trimmedQuery,
    onClose,
    goTo,
    submitAi,
  ]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[90]">
        <motion.button
          type="button"
          aria-label="Close command palette"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="AI command palette"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="relative mx-auto flex max-h-[min(85dvh,calc(100dvh-2rem))] w-[min(100%-1rem,620px)] flex-col overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#111111] shadow-[0_32px_100px_rgba(0,0,0,0.55),0_0_80px_rgba(59,130,246,0.12)] max-sm:fixed max-sm:inset-x-3 max-sm:bottom-[max(0.75rem,env(safe-area-inset-bottom))] max-sm:top-auto max-sm:mt-0 max-sm:max-h-[min(88dvh,calc(100dvh-1.5rem))] max-sm:w-auto max-sm:rounded-2xl sm:mt-[8vh] md:mt-[10vh]"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#3B82F6]/40 to-transparent" />

          <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 pt-2">
            <button
              type="button"
              onClick={() => setMode("ai")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                mode === "ai"
                  ? "bg-[#3B82F6]/15 text-[#93C5FD]"
                  : "text-[#71717A] hover:text-white"
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Ask Roxx
            </button>
            <button
              type="button"
              onClick={() => setMode("search")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                mode === "search"
                  ? "bg-[#3B82F6]/15 text-[#93C5FD]"
                  : "text-[#71717A] hover:text-white"
              )}
            >
              <Search className="h-3.5 w-3.5" />
              Search
            </button>
            <div className="ml-auto hidden text-[10px] text-[#52525B] sm:block">
              Tab to switch · ↵ to {mode === "ai" ? "ask Roxx" : "open"}
            </div>
          </div>

          <div className="flex items-center gap-3 border-b border-white/[0.06] px-4">
            {mode === "ai" ? (
              <Sparkles className="h-4 w-4 shrink-0 text-[#3B82F6]" />
            ) : (
              <Search className="h-4 w-4 shrink-0 text-[#71717A]" />
            )}
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                mode === "ai"
                  ? "Ask Roxx anything…"
                  : "Search tasks, CRM, meetings, documents…"
              }
              className="h-12 w-full bg-transparent text-sm text-white outline-none placeholder:text-[#71717A]"
            />
            {mode === "search" && searching && (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#3B82F6]" />
            )}
          </div>

          <div className="max-h-[min(380px,50dvh)] overflow-y-auto p-2 premium-scrollbar sm:max-h-[380px]">
            {mode === "ai" && !trimmedQuery && pinned.length > 0 && (
              <p className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#52525B]">
                Pinned commands
              </p>
            )}
            {mode === "ai" && !trimmedQuery && pinned.length === 0 && (
              <p className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#52525B]">
                {promptHistory.length ? "Recent & quick actions" : "OS commands"}
              </p>
            )}
            {mode === "search" && !trimmedQuery && recentSearches.length > 0 && (
              <>
                <p className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#52525B]">
                  Recent searches
                </p>
                {recentSearches.map((item) => (
                  <button
                    key={item.at + item.query}
                    type="button"
                    onClick={() => setQuery(item.query)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-[#A1A1AA] transition-colors hover:bg-white/[0.03] hover:text-white"
                  >
                    <Clock className="h-3.5 w-3.5 text-[#52525B]" />
                    {item.query}
                  </button>
                ))}
              </>
            )}

            {mode === "search" && !trimmedQuery && recentSearches.length === 0 && (
              <p className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#52525B]">
                Quick navigation
              </p>
            )}

            {listItems.length === 0 && mode === "search" && trimmedQuery && !searching && (
              <p className="px-3 py-8 text-center text-sm text-[#71717A]">
                No matches for “{trimmedQuery}”
              </p>
            )}

            {listItems.map((item, index) => {
              const Icon = item.icon;
              const isPinned =
                mode === "ai" &&
                pinned.some(
                  (p) => p.toLowerCase() === item.label.toLowerCase()
                );
              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex w-full items-center gap-1 rounded-xl transition-colors",
                    index === activeIndex
                      ? "bg-[#3B82F6]/15 text-white"
                      : "text-[#A1A1AA] hover:bg-white/[0.03]"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (mode === "ai") {
                        submitAi(item.label);
                      } else if ("href" in item && item.href) {
                        goTo(item.href, trimmedQuery || undefined);
                      }
                    }}
                    className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-[#0A0A0A]">
                      <Icon className="h-4 w-4 text-[#3B82F6]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">
                        {item.label}
                      </span>
                      {"description" in item && item.description && (
                        <span className="block truncate text-xs text-[#71717A]">
                          {item.category} · {item.description}
                        </span>
                      )}
                    </span>
                  </button>
                  {mode === "ai" && (
                    <button
                      type="button"
                      aria-label={isPinned ? "Unpin command" : "Pin command"}
                      title={isPinned ? "Unpin" : "Pin"}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPinned(togglePinnedCommand(item.label));
                      }}
                      className={cn(
                        "mr-2 rounded-lg p-2 transition-colors",
                        isPinned
                          ? "text-[#93C5FD]"
                          : "text-[#52525B] hover:text-[#A1A1AA]"
                      )}
                    >
                      <Pin
                        className={cn(
                          "h-3.5 w-3.5",
                          isPinned && "fill-current"
                        )}
                      />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2 text-[11px] text-[#52525B]">
            <button
              type="button"
              onClick={() => openCopilot()}
              className="text-[#71717A] transition-colors hover:text-[#93C5FD]"
            >
              Open Roxx panel
            </button>
            <span>↑↓ navigate · esc close</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export const RoxxCommandTrigger = memo(function RoxxCommandTrigger() {
  const { openCommand } = useRoxx();

  return (
    <>
      <div className="relative hidden min-w-0 max-w-xl flex-1 md:block">
        <Sparkles className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3B82F6]" />
        <button
          type="button"
          onClick={openCommand}
          className="flex w-full items-center rounded-xl border border-white/[0.08] bg-[#0A0A0A] py-2.5 pl-10 pr-3 text-left text-sm text-[#71717A] transition-colors hover:border-[#3B82F6]/35"
        >
          <span className="flex-1 truncate">Ask Roxx anything…</span>
          <kbd className="ml-2 hidden rounded-md border border-white/[0.08] bg-[#111111] px-1.5 py-0.5 text-[10px] text-[#71717A] lg:inline">
            ⌘K
          </kbd>
        </button>
      </div>

      <button
        type="button"
        onClick={openCommand}
        className="rounded-xl border border-white/[0.08] p-2.5 text-[#A1A1AA] md:hidden interactive-press touch-target"
        aria-label="Open AI command bar"
      >
        <Sparkles className="h-4 w-4 text-[#3B82F6]" />
      </button>
    </>
  );
});
