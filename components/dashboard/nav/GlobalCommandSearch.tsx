"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Calendar,
  CreditCard,
  Inbox,
  Kanban,
  ListTodo,
  Search,
  Settings,
  Sparkles,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SearchItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  category: string;
  icon: LucideIcon;
  keywords: string[];
};

const SEARCH_INDEX: SearchItem[] = [
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
    id: "crm",
    label: "CRM Overview",
    description: "Contacts, companies, and pipeline",
    href: "/dashboard/crm",
    category: "Contacts",
    icon: Kanban,
    keywords: ["crm", "contact", "deal", "pipeline"],
  },
  {
    id: "contacts",
    label: "Contacts",
    description: "Browse and manage CRM contacts",
    href: "/dashboard/crm/contacts",
    category: "Contacts",
    icon: Kanban,
    keywords: ["people", "leads"],
  },
  {
    id: "deals",
    label: "Deals",
    description: "Track opportunities and revenue",
    href: "/dashboard/crm/deals",
    category: "Deals",
    icon: Kanban,
    keywords: ["deal", "opportunity", "pipeline"],
  },
  {
    id: "pipeline",
    label: "Pipeline",
    description: "Kanban board for deals",
    href: "/dashboard/crm/pipeline",
    category: "Deals",
    icon: Kanban,
    keywords: ["board", "kanban"],
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
    id: "meetings",
    label: "Meetings",
    description: "Calendar and upcoming events",
    href: "/dashboard/meetings",
    category: "Meetings",
    icon: Calendar,
    keywords: ["calendar", "schedule"],
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
    id: "analytics",
    label: "Analytics",
    description: "KPIs and performance metrics",
    href: "/dashboard/summary",
    category: "Settings",
    icon: Sparkles,
    keywords: ["metrics", "charts", "summary"],
  },
  {
    id: "assistant",
    label: "AI Assistant",
    description: "Conversation-first workspace home",
    href: "/dashboard",
    category: "Settings",
    icon: Bot,
    keywords: ["assistant", "ai", "home"],
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
    id: "billing",
    label: "Billing",
    description: "Plans, invoices, and upgrades",
    href: "/billing",
    category: "Settings",
    icon: CreditCard,
    keywords: ["plan", "invoice", "upgrade"],
  },
];

type GlobalCommandSearchProps = {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
};

export function GlobalCommandSearch({
  searchQuery = "",
  onSearchChange,
}: GlobalCommandSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(searchQuery);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SEARCH_INDEX.slice(0, 8);
    return SEARCH_INDEX.filter((item) => {
      const haystack = [
        item.label,
        item.description,
        item.category,
        ...item.keywords,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    }).slice(0, 10);
  }, [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  const close = useCallback(() => setOpen(false), []);

  const goTo = useCallback(
    (href: string) => {
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
        goTo(results[activeIndex].href);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, results, activeIndex, close, goTo]);

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
                <Search className="h-4 w-4 text-[#71717A]" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    onSearchChange?.(e.target.value);
                  }}
                  placeholder="Search emails, contacts, deals, tasks…"
                  className="h-12 w-full bg-transparent text-sm text-white outline-none placeholder:text-[#71717A]"
                />
              </div>

              <div className="max-h-[360px] overflow-y-auto p-2">
                {results.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-[#71717A]">
                    No matches for “{query}”
                  </p>
                ) : (
                  results.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => goTo(item.href)}
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
                          <span className="block text-sm font-medium text-white">
                            {item.label}
                          </span>
                          <span className="block truncate text-xs text-[#71717A]">
                            {item.category} · {item.description}
                          </span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
