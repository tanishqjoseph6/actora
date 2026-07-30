"use client";

import { Sparkles, X } from "lucide-react";
import dynamic from "next/dynamic";
import { DrawerShell } from "@/components/ui/DrawerShell";
import { Skeleton } from "@/components/ui/Skeleton";

const AiAssistantPanel = dynamic(
  () =>
    import("@/components/dashboard/premium/AiAssistantPanel").then(
      (m) => m.AiAssistantPanel
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full flex-col p-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="mt-4 h-full w-full rounded-2xl" />
      </div>
    ),
  }
);

type GlobalCopilotDrawerProps = {
  open: boolean;
  onClose: () => void;
  pendingPrompt: string | null;
  onPendingPromptConsumed: () => void;
};

export function GlobalCopilotDrawer({
  open,
  onClose,
  pendingPrompt,
  onPendingPromptConsumed,
}: GlobalCopilotDrawerProps) {
  return (
    <DrawerShell
      open={open}
      onClose={onClose}
      titleId="roxx-copilot-title"
      widthClassName="max-w-xl"
      className="border-white/[0.08]"
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3B82F6]/15 text-[#3B82F6]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 id="roxx-copilot-title" className="text-sm font-semibold text-white">
                Roxx AI
              </h2>
              <p className="text-[11px] text-[#71717A]">
                Where conversations become execution.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/[0.08] p-2 text-[#71717A] transition-colors hover:text-white"
            aria-label="Close Roxx AI"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <AiAssistantPanel
            variant="drawer"
            pendingPrompt={pendingPrompt}
            onPendingPromptConsumed={onPendingPromptConsumed}
            onClose={onClose}
          />
        </div>
      </div>
    </DrawerShell>
  );
}
