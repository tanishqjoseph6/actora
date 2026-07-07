"use client";

import { PremiumEmptyState } from "@/components/ui/PremiumEmptyState";

type AutomationEmptyStateProps = {
  onCreate: () => void;
};

export function AutomationEmptyState({ onCreate }: AutomationEmptyStateProps) {
  return (
    <PremiumEmptyState
      illustration="automations"
      title="No automations yet"
      description="Connect triggers, AI actions, and outputs into workflows that run repetitive work automatically — like Zapier, built for your AI workforce."
      cta={{
        label: "Create your first automation",
        onClick: onCreate,
      }}
      className="border-dashed bg-[#111827]/50"
    />
  );
}
