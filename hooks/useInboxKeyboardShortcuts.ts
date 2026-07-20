"use client";

import { useEffect, useRef } from "react";
import type { InboxEmail } from "@/lib/gmail";

type UseInboxKeyboardShortcutsOptions = {
  enabled?: boolean;
  filteredEmails: InboxEmail[];
  listFocusIndex: number;
  selectedEmail: InboxEmail | null;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  onFocusSearch: () => void;
  onOpenEmail: (email: InboxEmail) => void;
  onOpenAiReply: (email: InboxEmail) => void;
  onArchive: (email: InboxEmail) => void;
  onStar: (email: InboxEmail) => void;
  onClosePanel: () => void;
  onMoveFocus: (index: number) => InboxEmail | null;
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

export function useInboxKeyboardShortcuts({
  enabled = true,
  filteredEmails,
  listFocusIndex,
  selectedEmail,
  searchInputRef,
  onFocusSearch,
  onOpenEmail,
  onOpenAiReply,
  onArchive,
  onStar,
  onClosePanel,
  onMoveFocus,
}: UseInboxKeyboardShortcutsOptions) {
  const indexRef = useRef(listFocusIndex);
  indexRef.current = listFocusIndex;

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "/" && !isTypingTarget(event.target)) {
        event.preventDefault();
        onFocusSearch();
        searchInputRef?.current?.focus();
        return;
      }

      if (isTypingTarget(event.target)) return;

      if (event.key === "Escape" && selectedEmail) {
        event.preventDefault();
        onClosePanel();
        return;
      }

      if (selectedEmail) {
        if (event.key === "e") {
          event.preventDefault();
          void onArchive(selectedEmail);
        }
        if (event.key === "s") {
          event.preventDefault();
          void onStar(selectedEmail);
        }
        if (event.key === "r") {
          event.preventDefault();
          onOpenAiReply(selectedEmail);
        }
        return;
      }

      if (event.key === "j" || event.key === "ArrowDown") {
        event.preventDefault();
        onMoveFocus(indexRef.current + 1);
      }
      if (event.key === "k" || event.key === "ArrowUp") {
        event.preventDefault();
        onMoveFocus(indexRef.current - 1);
      }
      if (event.key === "Enter" || event.key === "o") {
        const email = filteredEmails[indexRef.current];
        if (email) {
          event.preventDefault();
          onOpenEmail(email);
        }
      }
      if (event.key === "e") {
        const email = filteredEmails[indexRef.current];
        if (email) {
          event.preventDefault();
          void onArchive(email);
        }
      }
      if (event.key === "s") {
        const email = filteredEmails[indexRef.current];
        if (email) {
          event.preventDefault();
          void onStar(email);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    enabled,
    filteredEmails,
    onArchive,
    onClosePanel,
    onFocusSearch,
    onMoveFocus,
    onOpenAiReply,
    onOpenEmail,
    onStar,
    searchInputRef,
    selectedEmail,
  ]);
}
