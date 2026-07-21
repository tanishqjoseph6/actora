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
  Search,
  Settings,
  Sparkles,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { fetchJson } from "@/lib/api/fetch-json";
import type { GlobalSearchCategory, GlobalSearchResult } from "@/lib/search/types";
import { cn } from "@/lib/utils";

const RECENT_SEARCHES_KEY = "actora_recent_searches_v1";
const MAX_RECENT = 8;

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
    id: "companies",
    label: "Companies",
    description: "Accounts and organizations",
    href: "/dashboard/crm/companies",
    category: "Companies",
    icon: Building2,
    keywords: ["company", "account", "organization"],
  },
  {
    id: "deals",
    label: "Deals",
    description: "Track opportunities and revenue",
    href: "/dashboard/crm/deals",
    category: "Deals",
    icon: Handshake,
    keywords: ["deal", "opportunity", "pipeline"],
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
    id: "settings",
    label: "Settings",
    description: "Workspace, profile, and integrations",
    href: "/dashboard/settings",
    category: "Settings",
    icon: Settings,
    keywords: ["profile", "security", "preferences"],
  },
  {
    id: "assistant",
    label: "Roxx AI",
    description: "Conversation-first workspace home",
    href: "/dashboard",
    category: "Roxx AI",
    icon: Bot,
    keywords: ["assistant", "ai", "home", "roxx"],
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "KPIs and performance metrics",
    href: "/dashboard/summary",
    category: "Settings",
    icon: Sparkles,
    keywords: ["metrics", "charts", "summary"],
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
    const haystack = [
      item.label,
      item.description,
      item.category,
      ...item.keywords,
    ]
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

export const GlobalCommandSearch = memo(function GlobalCommandSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [remoteResults, setRemoteResults] = useState<SearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  useEffect(() => {
    if (open) setRecentSearches(loadRecentSearches());
  }, [open]);

  const trimmedQuery = query.trim();

  useEffect(() => {
    if (!trimmedQuery) {
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
  }, [trimmedQuery]);

  const results = useMemo(() => {
    if (trimmedQuery) {
      if (remoteResults.length > 0) return remoteResults;
      return filterNavItems(trimmedQuery);
    }
    return filterNavItems("");
  }, [trimmedQuery, remoteResults]);

  const showRecent = !trimmedQuery && recentSearches.length > 0;

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open, results.length]);

  const close = useCallback(() => setOpen(false), []);

  const goTo = useCallback(
    (href: string, searchTerm?: string) => {
      if (searchTerm) saveRecentSearch(searchTerm);
      close();
      router.push(href);
    },
    [close, router]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isK = event.key.toLowerCase() === "k";
      if ((event.metaKey || event.ctrlKey) && isK) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (event.key === "Enter" && results[activeIndex]) {
        event.preventDefault();
        goTo(results[activeIndex].href, trimmedQuery || undefined);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, results, activeIndex, close, goTo, trimmedQuery]);

  return (
    <>
      <div className="relative hidden min-w-0 max-w-xl flex-1 md:block">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717A]" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center rounded-xl border border-white/[0.08] bg-[#0A0A0A] py-2.5 pl-10 pr-3 text-left text-sm text-[#71717A] transition-colors hover:border-[#3B82F6]/35"
        >
          <span className="flex-1 truncate">
            {query || "Search emails, contacts, deals…"}
          </span>
          <kbd className="ml-2 hidden rounded-md border border-white/[0.08] bg-[#111111] px-1.5 py-0.5 text-[10px] text-[#71717A] lg:inline">
            ⌘K
          </kbd>
        </button>
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-white/[0.08] p-2 text-[#A1A1AA] md:hidden"
        aria-label="Open search"
      >
        <Search className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[80]">
            <motion.button
              type="button"
              aria-label="Close search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={close}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Global search"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="relative mx-auto mt-[12vh] w-[min(100%-1.5rem,560px)] overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#111111] shadow-[0_32px_100px_rgba(0,0,0,0.55)]"
            >
              <div className="flex items-center gap-3 border-b border-white/[0.06] px-4">
                <Search className="h-4 w-4 shrink-0 text-[#71717A]" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                  }}
                  placeholder="Search emails, contacts, deals, tasks…"
                  className="h-12 w-full bg-transparent text-sm text-white outline-none placeholder:text-[#71717A]"
                />
                {searching && (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#3B82F6]" />
                )}
              </div>

              <div className="max-h-[360px] overflow-y-auto p-2">
                {showRecent && (
                  <div className="mb-2 px-1">
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
                  </div>
                )}

                {!showRecent && !trimmedQuery && (
                  <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#52525B]">
                    Quick navigation
                  </p>
                )}

                {trimmedQuery && searching && results.length === 0 && (
                  <p className="px-3 py-8 text-center text-sm text-[#71717A]">
                    Searching…
                  </p>
                )}

                {!searching && results.length === 0 && trimmedQuery && (
                  <p className="px-3 py-8 text-center text-sm text-[#71717A]">
                    No matches for “{trimmedQuery}”
                  </p>
                )}

                {results.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => goTo(item.href, trimmedQuery || undefined)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                        index === activeIndex
                          ? "bg-[#3B82F6]/15 text-white"
                          : "text-[#A1A1AA] hover:bg-white/[0.03]"
                      )}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-[#0A0A0A]">
                        <Icon className="h-4 w-4 text-[#3B82F6]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-white">
                          {item.label}
                        </span>
                        <span className="block truncate text-xs text-[#71717A]">
                          {item.category} · {item.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2 text-[11px] text-[#52525B]">
                <span>↑↓ navigate</span>
                <span>↵ open · esc close</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
});
