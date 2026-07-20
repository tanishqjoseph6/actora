"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export type ShortcutChord = {
  keys: string;
  description: string;
  group: string;
};

export const DASHBOARD_SHORTCUTS: ShortcutChord[] = [
  { keys: "⌘/Ctrl + K", description: "Open command search", group: "General" },
  { keys: "?", description: "Show keyboard shortcuts", group: "General" },
  { keys: "Esc", description: "Close menus and dialogs", group: "General" },
  { keys: "G then I", description: "Go to AI Inbox", group: "Navigation" },
  { keys: "G then C", description: "Go to CRM", group: "Navigation" },
  { keys: "G then T", description: "Go to Tasks", group: "Navigation" },
  { keys: "G then M", description: "Go to Calendar", group: "Navigation" },
  { keys: "G then A", description: "Go to Automations", group: "Navigation" },
  { keys: "G then Y", description: "Go to Analytics", group: "Navigation" },
  { keys: "G then S", description: "Go to Settings", group: "Navigation" },
  { keys: "G then B", description: "Go to Billing", group: "Navigation" },
  { keys: "G then H", description: "Go to Home", group: "Navigation" },
];

const GO_ROUTES: Record<string, string> = {
  i: "/dashboard/inbox",
  c: "/dashboard/crm",
  t: "/dashboard/tasks",
  m: "/dashboard/calendar",
  a: "/dashboard/automations",
  y: "/dashboard/summary",
  s: "/dashboard/settings",
  b: "/billing",
  h: "/dashboard",
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

type UseDashboardKeyboardShortcutsOptions = {
  onOpenShortcuts?: () => void;
};

export function useDashboardKeyboardShortcuts({
  onOpenShortcuts,
}: UseDashboardKeyboardShortcutsOptions = {}) {
  const router = useRouter();
  const pendingG = useRef(false);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPending = useCallback(() => {
    pendingG.current = false;
    if (clearTimer.current) {
      clearTimeout(clearTimer.current);
      clearTimer.current = null;
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      const key = event.key.toLowerCase();

      if (key === "?" || (event.shiftKey && key === "/")) {
        event.preventDefault();
        onOpenShortcuts?.();
        return;
      }

      if (pendingG.current) {
        const href = GO_ROUTES[key];
        clearPending();
        if (href) {
          event.preventDefault();
          router.push(href);
        }
        return;
      }

      if (key === "g") {
        event.preventDefault();
        pendingG.current = true;
        clearTimer.current = setTimeout(clearPending, 1200);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearPending();
    };
  }, [router, onOpenShortcuts, clearPending]);
}
