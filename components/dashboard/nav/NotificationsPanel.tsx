"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Circle, MailOpen, Trash2 } from "lucide-react";
import { useDismissible } from "@/hooks/useDismissible";
import { useNotifications } from "@/providers/NotificationsProvider";
import { DropdownShell } from "./DropdownShell";
import { cn } from "@/lib/utils";

function formatRelative(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationsPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const {
    items,
    unreadCount,
    loading,
    markRead,
    toggleRead,
    markAllRead,
    clearAll,
  } = useNotifications();

  const close = useCallback(() => setOpen(false), []);
  const ref = useDismissible(open, close);

  const openItem = useCallback(
    (id: string, href: string) => {
      void markRead(id);
      close();
      router.push(href, { scroll: false });
    },
    [markRead, close, router]
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Notifications"
        className="relative flex rounded-xl border border-white/[0.08] p-2 text-[#71717A] transition-colors hover:border-[#3B82F6]/35 hover:text-white interactive-press"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#3B82F6] px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <DropdownShell
        open={open}
        widthClassName="w-[min(100vw-2rem,380px)] sm:w-[380px]"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-white">Notifications</p>
            <p className="text-xs text-[#71717A]">
              {loading
                ? "Loading…"
                : unreadCount
                  ? `${unreadCount} unread`
                  : "You're all caught up"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={!unreadCount}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-[#A1A1AA] transition-colors hover:bg-white/[0.04] hover:text-white disabled:opacity-40"
              title="Mark all as read"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
            <button
              type="button"
              onClick={() => void clearAll()}
              disabled={!items.length}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-[#A1A1AA] transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
              title="Clear all"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </div>

        <div className="max-h-[360px] overflow-y-auto p-2">
          {!loading && items.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <Bell className="mx-auto h-5 w-5 text-[#52525B]" />
              <p className="mt-2 text-sm text-[#A1A1AA]">No notifications yet</p>
              <p className="mt-1 text-xs text-[#71717A]">
                Gmail, CRM, calendar, and automation updates will show up here.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "group mb-1 flex gap-1 rounded-xl border transition-colors",
                  item.read
                    ? "border-transparent hover:bg-white/[0.03]"
                    : "border-[#3B82F6]/20 bg-[#3B82F6]/[0.07] hover:bg-[#3B82F6]/10"
                )}
              >
                <button
                  type="button"
                  onClick={() => openItem(item.id, item.href)}
                  className="min-w-0 flex-1 px-3 py-3 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[#3B82F6]">
                        {item.category}
                      </p>
                      <p className="mt-1 text-sm font-medium text-white">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-[#A1A1AA]">
                        {item.body}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] text-[#71717A]">
                      {formatRelative(item.createdAt)}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => void toggleRead(item.id)}
                  className="mr-2 mt-3 shrink-0 rounded-lg p-1.5 text-[#71717A] opacity-0 transition-all hover:bg-white/[0.04] hover:text-white group-hover:opacity-100"
                  title={item.read ? "Mark as unread" : "Mark as read"}
                  aria-label={item.read ? "Mark as unread" : "Mark as read"}
                >
                  {item.read ? (
                    <Circle className="h-3.5 w-3.5" />
                  ) : (
                    <MailOpen className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </DropdownShell>
    </div>
  );
}
