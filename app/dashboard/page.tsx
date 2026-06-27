"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { InboxEmail } from "@/lib/gmail";

type FetchState = "loading" | "error" | "success";
type FilterChip = "all" | "unread" | "starred";

const AVATAR_GRADIENTS = [
  "from-cyan-400 to-blue-600",
  "from-blue-400 to-indigo-600",
  "from-teal-400 to-cyan-600",
  "from-sky-400 to-blue-700",
  "from-cyan-500 to-teal-700",
  "from-indigo-400 to-violet-600",
] as const;

export default function Dashboard() {
  const [emails, setEmails] = useState<InboxEmail[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [fetchState, setFetchState] = useState<FetchState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterChip>("all");

  const loadEmails = useCallback(async (silent = false) => {
    if (!silent) {
      setFetchState("loading");
    } else {
      setIsRefreshing(true);
    }

    setError(null);

    try {
      const res = await fetch("/api/gmail");
      const data = await res.json();

      if (!res.ok) {
        if (!silent) {
          setFetchState("error");
          setError(data.error ?? "Failed to load emails");
          setEmails([]);
          setUnreadCount(0);
        }
        return;
      }

      setEmails(data.emails ?? []);
      setUnreadCount(data.unreadCount ?? 0);
      setFetchState("success");
    } catch {
      if (!silent) {
        setFetchState("error");
        setError("Failed to load emails. Check your connection and try again.");
        setEmails([]);
        setUnreadCount(0);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEmails();

    const interval = setInterval(() => {
      loadEmails(true);
    }, 60_000);

    return () => clearInterval(interval);
  }, [loadEmails]);

  const filteredEmails = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return emails.filter((email) => {
      if (activeFilter === "unread" && !email.unread) return false;
      if (activeFilter === "starred" && !email.starred) return false;

      if (!query) return true;

      return (
        email.sender.toLowerCase().includes(query) ||
        email.subject.toLowerCase().includes(query) ||
        email.preview.toLowerCase().includes(query)
      );
    });
  }, [emails, searchQuery, activeFilter]);

  const starredCount = useMemo(
    () => emails.filter((email) => email.starred).length,
    [emails]
  );

  return (
    <main className="min-h-screen bg-[#050816] text-white overflow-hidden">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-cyan-500/10 blur-[220px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 min-h-screen border-r border-cyan-400/20 bg-[#081226]/70 backdrop-blur-xl p-6 flex-col shrink-0">
          <h1 className="text-4xl font-bold text-cyan-400 mb-10">Actora</h1>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-400/20">
              📥 Inbox
            </div>
            <div className="p-3 rounded-xl hover:bg-cyan-500/10 cursor-pointer transition-colors duration-200">
              ⚡ Actions
            </div>
            <div className="p-3 rounded-xl hover:bg-cyan-500/10 cursor-pointer transition-colors duration-200">
              📅 Meetings
            </div>
            <div className="p-3 rounded-xl hover:bg-cyan-500/10 cursor-pointer transition-colors duration-200">
              📝 Tasks
            </div>
            <div className="p-3 rounded-xl hover:bg-cyan-500/10 cursor-pointer transition-colors duration-200">
              📊 Analytics
            </div>
            <div className="p-3 rounded-xl hover:bg-cyan-500/10 cursor-pointer transition-colors duration-200">
              ⚙️ Settings
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-cyan-400/20">
            <p className="text-cyan-400 font-semibold">Tanishq</p>
            <p className="text-gray-400 text-sm">Founder</p>
          </div>
        </aside>

        {/* Main Content */}
        <section className="flex-1 p-5 sm:p-8 lg:p-10 min-w-0">
          {/* Mobile header */}
          <div className="lg:hidden mb-6">
            <h1 className="text-2xl font-bold text-cyan-400">Actora</h1>
          </div>

          {/* Header */}
          <div className="mb-8 lg:mb-10">
            <div className="inline-block px-4 py-1 rounded-full border border-cyan-400 text-cyan-400 text-sm mb-4">
              ⚡ AI POWERED WORKSPACE
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
              Inbox <span className="text-cyan-400">Dashboard</span>
            </h1>

            <p className="text-gray-400 mt-3 lg:mt-4 text-base lg:text-lg">
              Manage emails, meetings and operations from one place.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6 mb-8">
            <StatCard
              title="Total Emails"
              value={fetchState === "loading" ? "—" : emails.length}
            />
            <StatCard title="AI Drafts" value={0} />
            <StatCard title="Meetings" value={0} />
            <StatCard title="Tasks" value={0} />
            <StatCard
              title="Unread"
              value={fetchState === "loading" ? "—" : unreadCount}
            />
            <StatCard title="AI Actions" value={0} />
          </div>

          {/* Inbox */}
          <div className="bg-[#081226]/80 border border-cyan-400/20 rounded-3xl p-5 sm:p-6 lg:p-8 mb-8 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold">Recent Emails</h2>
              {isRefreshing && (
                <span className="text-sm text-cyan-400/70 animate-pulse">
                  Refreshing…
                </span>
              )}
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                type="search"
                placeholder="Search emails…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#0d1730] border border-cyan-400/10 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20 transition-all duration-200"
              />
            </div>

            {/* Filter chips */}
            <div className="flex flex-wrap gap-2 mb-6">
              <FilterChipButton
                label="All"
                count={emails.length}
                active={activeFilter === "all"}
                onClick={() => setActiveFilter("all")}
              />
              <FilterChipButton
                label="Unread"
                count={unreadCount}
                active={activeFilter === "unread"}
                onClick={() => setActiveFilter("unread")}
              />
              <FilterChipButton
                label="Starred"
                count={starredCount}
                active={activeFilter === "starred"}
                onClick={() => setActiveFilter("starred")}
              />
            </div>

            {fetchState === "loading" && <EmailSkeletonList />}

            {fetchState === "error" && (
              <div className="bg-[#0d1730] border border-red-400/20 rounded-2xl p-6">
                <p className="text-red-300 font-medium mb-2">
                  Could not load Gmail inbox
                </p>
                <p className="text-gray-400 text-sm mb-4">{error}</p>
                <button
                  onClick={() => loadEmails()}
                  className="px-4 py-2 rounded-lg border border-cyan-400/30 text-cyan-400 hover:bg-cyan-500/10 transition-colors duration-200"
                >
                  Try again
                </button>
              </div>
            )}

            {fetchState === "success" && filteredEmails.length === 0 && (
              <EmptyInboxState
                filter={activeFilter}
                hasSearch={searchQuery.trim().length > 0}
              />
            )}

            {fetchState === "success" && filteredEmails.length > 0 && (
              <div className="space-y-2">
                {filteredEmails.map((email) => (
                  <EmailCard key={email.id} email={email} />
                ))}
              </div>
            )}
          </div>

          {/* Bottom Cards */}
          <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
            <div className="bg-[#081226] border border-cyan-400/20 rounded-3xl p-6 lg:p-8">
              <h3 className="text-xl font-bold mb-4">Today&apos;s Summary</h3>
              <p className="text-gray-400">No activity yet.</p>
            </div>

            <div className="bg-[#081226] border border-cyan-400/20 rounded-3xl p-6 lg:p-8">
              <h3 className="text-xl font-bold mb-4">Upcoming Tasks</h3>
              <p className="text-gray-400">No pending tasks.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function EmailCard({ email }: { email: InboxEmail }) {
  const initials = getInitials(email.sender);
  const gradient = getAvatarGradient(email.sender);

  return (
    <article
      className={`
        group relative flex gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl
        bg-[#0d1730]/60 border border-cyan-400/10
        transition-all duration-300 ease-out
        hover:bg-[#0d1730] hover:border-cyan-400/30 hover:shadow-lg hover:shadow-cyan-500/5
        hover:-translate-y-0.5 cursor-pointer
        ${email.unread ? "border-l-2 border-l-cyan-400" : ""}
      `}
    >
      {/* Avatar */}
      <div
        className={`shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-xs sm:text-sm font-semibold text-white shadow-md transition-transform duration-300 group-hover:scale-105`}
      >
        {initials}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <p
              className={`truncate text-sm sm:text-base ${
                email.unread ? "text-white font-semibold" : "text-gray-200"
              }`}
            >
              {email.sender}
            </p>
            {email.unread && (
              <span className="shrink-0 px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300">
                Unread
              </span>
            )}
            {email.starred && (
              <StarIcon className="shrink-0 w-3.5 h-3.5 text-amber-400" />
            )}
          </div>
          <time className="shrink-0 text-xs sm:text-sm text-gray-500 group-hover:text-gray-400 transition-colors duration-200">
            {email.date}
          </time>
        </div>

        <p
          className={`mt-1 truncate text-sm sm:text-base ${
            email.unread ? "font-medium text-white" : "text-gray-300"
          }`}
        >
          {email.subject}
        </p>

        <p className="mt-1 text-xs sm:text-sm text-gray-500 line-clamp-2 leading-relaxed group-hover:text-gray-400 transition-colors duration-200">
          {email.preview}
        </p>
      </div>
    </article>
  );
}

function EmailSkeletonList() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 p-4 sm:p-5 rounded-2xl bg-[#0d1730]/40 border border-cyan-400/5 animate-pulse"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-cyan-400/10 shrink-0" />
          <div className="flex-1 space-y-2.5">
            <div className="flex justify-between">
              <div className="h-4 w-28 bg-cyan-400/10 rounded" />
              <div className="h-3 w-12 bg-cyan-400/10 rounded" />
            </div>
            <div className="h-4 w-2/3 bg-cyan-400/10 rounded" />
            <div className="h-3 w-full bg-cyan-400/10 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyInboxState({
  filter,
  hasSearch,
}: {
  filter: FilterChip;
  hasSearch: boolean;
}) {
  const message = hasSearch
    ? "No emails match your search."
    : filter === "unread"
      ? "You're all caught up — no unread emails."
      : filter === "starred"
        ? "No starred emails yet."
        : "Your inbox is empty.";

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center mb-5">
        <InboxIcon className="w-8 h-8 text-cyan-400/60" />
      </div>
      <p className="text-gray-300 font-medium mb-1">{message}</p>
      <p className="text-sm text-gray-500">
        {hasSearch
          ? "Try a different search term or clear filters."
          : "New messages will appear here automatically."}
      </p>
    </div>
  );
}

function FilterChipButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium
        transition-all duration-200
        ${
          active
            ? "bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-sm shadow-cyan-500/10"
            : "bg-[#0d1730] border border-cyan-400/10 text-gray-400 hover:border-cyan-400/25 hover:text-gray-300"
        }
      `}
    >
      {label}
      <span
        className={`text-xs tabular-nums ${active ? "text-cyan-400/80" : "text-gray-500"}`}
      >
        {count}
      </span>
    </button>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number | string;
}) {
  return (
    <div className="bg-[#081226] border border-cyan-400/20 rounded-3xl p-4 sm:p-6">
      <h3 className="text-gray-400 text-sm sm:text-base">{title}</h3>
      <p className="text-2xl sm:text-4xl font-bold text-cyan-400 mt-1 sm:mt-2">
        {value}
      </p>
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" />
    </svg>
  );
}
