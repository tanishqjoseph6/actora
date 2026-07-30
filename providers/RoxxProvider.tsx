"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { savePromptToHistory } from "@/lib/ai/prompt-history";

const GlobalAiCommandPalette = dynamic(
  () =>
    import("@/components/dashboard/ai/GlobalAiCommandPalette").then(
      (m) => m.GlobalAiCommandPalette
    ),
  { ssr: false }
);

const GlobalCopilotDrawer = dynamic(
  () =>
    import("@/components/dashboard/ai/GlobalCopilotDrawer").then(
      (m) => m.GlobalCopilotDrawer
    ),
  { ssr: false }
);

type RoxxContextValue = {
  commandOpen: boolean;
  copilotOpen: boolean;
  pendingPrompt: string | null;
  openCommand: () => void;
  closeCommand: () => void;
  openCopilot: (prompt?: string) => void;
  closeCopilot: () => void;
  askRoxx: (prompt: string) => void;
  clearPendingPrompt: () => void;
};

const RoxxContext = createContext<RoxxContextValue | null>(null);

export function RoxxProvider({ children }: { children: ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  const openCommand = useCallback(() => setCommandOpen(true), []);
  const closeCommand = useCallback(() => setCommandOpen(false), []);
  const openCopilot = useCallback((prompt?: string) => {
    if (prompt?.trim()) {
      savePromptToHistory(prompt);
      setPendingPrompt(prompt.trim());
    }
    setCopilotOpen(true);
  }, []);
  const closeCopilot = useCallback(() => setCopilotOpen(false), []);
  const clearPendingPrompt = useCallback(() => setPendingPrompt(null), []);

  const askRoxx = useCallback(
    (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed) return;
      savePromptToHistory(trimmed);
      setPendingPrompt(trimmed);
      setCommandOpen(false);
      setCopilotOpen(true);
    },
    []
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const mod = event.metaKey || event.ctrlKey;

      if (mod && key === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
        return;
      }

      if (mod && key === "j") {
        event.preventDefault();
        setCopilotOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo<RoxxContextValue>(
    () => ({
      commandOpen,
      copilotOpen,
      pendingPrompt,
      openCommand,
      closeCommand,
      openCopilot,
      closeCopilot,
      askRoxx,
      clearPendingPrompt,
    }),
    [
      commandOpen,
      copilotOpen,
      pendingPrompt,
      openCommand,
      closeCommand,
      openCopilot,
      closeCopilot,
      askRoxx,
      clearPendingPrompt,
    ]
  );

  return (
    <RoxxContext.Provider value={value}>
      {children}
      {commandOpen && (
        <GlobalAiCommandPalette open={commandOpen} onClose={closeCommand} />
      )}
      {copilotOpen && (
        <GlobalCopilotDrawer
          open={copilotOpen}
          onClose={closeCopilot}
          pendingPrompt={pendingPrompt}
          onPendingPromptConsumed={clearPendingPrompt}
        />
      )}
    </RoxxContext.Provider>
  );
}

export function useRoxx() {
  const ctx = useContext(RoxxContext);
  if (!ctx) {
    throw new Error("useRoxx must be used within RoxxProvider");
  }
  return ctx;
}

export function useRoxxOptional() {
  return useContext(RoxxContext);
}
