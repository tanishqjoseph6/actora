"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Keyboard, X } from "lucide-react";
import {
  DASHBOARD_SHORTCUTS,
  type ShortcutChord,
} from "@/hooks/useDashboardKeyboardShortcuts";

type KeyboardShortcutsModalProps = {
  open: boolean;
  onClose: () => void;
};

export function KeyboardShortcutsModal({
  open,
  onClose,
}: KeyboardShortcutsModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const groups = DASHBOARD_SHORTCUTS.reduce<Record<string, ShortcutChord[]>>(
    (acc, item) => {
      (acc[item.group] ??= []).push(item);
      return acc;
    },
    {}
  );

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="keyboard-shortcuts-title"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-lg overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#111111] p-6 shadow-[0_32px_100px_rgba(0,0,0,0.55)] sm:p-8"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-xl border border-white/[0.08] p-2 text-[#A1A1AA] transition-colors hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3B82F6]/35 bg-[#3B82F6]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#93C5FD]">
              <Keyboard className="h-3 w-3" />
              Shortcuts
            </span>
            <h2
              id="keyboard-shortcuts-title"
              className="mt-3 text-2xl font-semibold tracking-tight text-white"
            >
              Keyboard shortcuts
            </h2>
            <p className="mt-2 text-sm text-[#A1A1AA]">
              Move through Actora without leaving the keyboard.
            </p>

            <div className="mt-6 space-y-5">
              {Object.entries(groups).map(([group, items]) => (
                <div key={group}>
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-[#52525B]">
                    {group}
                  </p>
                  <ul className="space-y-1.5">
                    {items.map((item) => (
                      <li
                        key={item.keys}
                        className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-[#0A0A0A] px-3 py-2.5"
                      >
                        <span className="text-sm text-[#A1A1AA]">
                          {item.description}
                        </span>
                        <kbd className="shrink-0 rounded-md border border-white/[0.08] bg-[#111111] px-2 py-1 text-[11px] font-medium text-[#93C5FD]">
                          {item.keys}
                        </kbd>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
