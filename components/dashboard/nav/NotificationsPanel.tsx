"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useDismissible } from "@/hooks/useDismissible";
import { DropdownShell } from "./DropdownShell";
import { cn } from "@/lib/utils";

type NotificationCategory =
  | "AI Replies"
  | "Inbox"
  | "CRM"
  | "Tasks"
  | "Meetings"
  | "Automations"
  | "Billing";

type NotificationItem = {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
};

const STORAGE_KEY = "actora_dashboard_notifications_v1";

const SEED: NotificationItem[] = [
  {
    id: "n1",
    category: "AI Replies",
    title: "Smart reply ready",
    body: "Actora drafted a reply for Acme partnership follow-up.",
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    read: false,
  },
  {
    id: "n2",
    category: "Inbox",
    title: "3 unread emails",
    body: "New messages synced from your connected Gmail account.",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    read: false,
  },
  {
    id: "n3",
    category: "CRM",
    title: "Deal updated",
    body: "Pipeline stage changed for Northline opportunity.",
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    read: false,
  },
  {
    id: "n4",
    category: "Tasks",
    title: "AI created a task",
    body: "“Send pricing deck” was added from today’s email thread.",
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    read: true,
  },
  {
    id: "n5",
    category: "Meetings",
    title: "Meeting in 1 hour",
    body: "Demo with Meridian Labs starts soon.",
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    read: true,
  },
  {
    id: "n6",
    category: "Billing",
    title: "Trial reminder",
    body: "Your free trial ends soon. Upgrade to keep Pro features.",
    createdAt: new Date(Date.now() - 1000 * 60 * 400).toISOString(),
    read: true,
  },
];

function loadNotifications(): NotificationItem[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw) as NotificationItem[];
    return Array.isArray(parsed) && parsed.length ? parsed : SEED;
  } catch {
    return SEED;
  }
}

function formatRelative(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);

  useEffect(() => {
    setItems(loadNotifications());
  }, []);

  const persist = useCallback((next: NotificationItem[]) => {
    setItems(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const close = useCallback(() => setOpen(false), []);
  const ref = useDismissible(open, close);
  const unread = useMemo(() => items.filter((i) => !i.read).length, [items]);

  const markRead = (id: string) => {
    persist(items.map((item) => (item.id === id ? { ...item, read: true } : item)));
  };

  const markAllRead = () => {
    persist(items.map((item) => ({ ...item, read: true })));
  };

  return (
    <div className="relative hidden sm:block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Notifications"
        className="relative flex rounded-xl border border-white/[0.08] p-2 text-[#71717A] transition-colors hover:border-[#3B82F6]/35 hover:text-white interactive-press"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#3B82F6] px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <DropdownShell open={open} widthClassName="w-[380px]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-white">Notifications</p>
            <p className="text-xs text-[#71717A]">
              {unread ? `${unread} unread` : "You're all caught up"}
            </p>
          </div>
          <button
            type="button"
            onClick={markAllRead}
            disabled={!unread}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-[#A1A1AA] transition-colors hover:bg-white/[0.04] hover:text-white disabled:opacity-40"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        </div>

        <div className="max-h-[360px] overflow-y-auto p-2">
          {items.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <Bell className="mx-auto h-5 w-5 text-[#52525B]" />
              <p className="mt-2 text-sm text-[#A1A1AA]">No notifications yet</p>
              <p className="mt-1 text-xs text-[#71717A]">
                AI replies, CRM updates, and tasks will show up here.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => markRead(item.id)}
                className={cn(
                  "mb-1 w-full rounded-xl border px-3 py-3 text-left transition-colors",
                  item.read
                    ? "border-transparent hover:bg-white/[0.03]"
                    : "border-[#3B82F6]/20 bg-[#3B82F6]/[0.07] hover:bg-[#3B82F6]/10"
                )}
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
            ))
          )}
        </div>
      </DropdownShell>
    </div>
  );
}
