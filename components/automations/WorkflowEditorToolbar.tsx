"use client";

import { motion } from "framer-motion";
import type { WorkflowStatus } from "@/lib/automations/types";
import { AutomationStatusBadge } from "./AutomationStatusBadge";

type WorkflowEditorToolbarProps = {
  workflowName: string;
  description: string;
  status: WorkflowStatus | null;
  saving?: boolean;
  testing?: boolean;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onPause: () => void;
  onRunTest: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canSave: boolean;
};

export function WorkflowEditorToolbar({
  workflowName,
  description,
  status,
  saving,
  testing,
  onNameChange,
  onDescriptionChange,
  onSaveDraft,
  onPublish,
  onPause,
  onRunTest,
  onDuplicate,
  onDelete,
  canSave,
}: WorkflowEditorToolbarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[20px] bg-[#111827]/70 border border-[#1E293B] backdrop-blur-xl p-4 sm:p-5 mb-4"
    >
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Workflow name"
            className="w-full text-lg font-semibold bg-transparent border-b border-[#1E293B] pb-2 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#1E293B]"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Description (optional)"
            className="w-full text-sm bg-transparent text-gray-400 placeholder:text-gray-600 focus:outline-none"
          />
        </div>

        {status && <AutomationStatusBadge status={status} size="md" />}
      </div>

      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#1E293B]">
        <ToolbarButton
          label={saving ? "Saving…" : "Save Draft"}
          onClick={onSaveDraft}
          disabled={!canSave || saving}
          variant="secondary"
        />
        <ToolbarButton
          label={status === "paused" ? "Re-activate" : "Publish"}
          onClick={onPublish}
          disabled={!canSave || saving}
          variant="primary"
        />
        {status === "active" && (
          <ToolbarButton label="Pause" onClick={onPause} disabled={saving} variant="secondary" />
        )}
        <ToolbarButton
          label={testing ? "Running…" : "Run Test"}
          onClick={onRunTest}
          disabled={!canSave || testing}
          variant="accent"
        />
        <ToolbarButton label="Duplicate" onClick={onDuplicate} disabled={!canSave} variant="secondary" />
        <ToolbarButton label="Delete" onClick={onDelete} disabled={!canSave} variant="danger" />
      </div>
    </motion.div>
  );
}

function ToolbarButton({
  label,
  onClick,
  disabled,
  variant,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant: "primary" | "secondary" | "accent" | "danger";
}) {
  const styles = {
    primary:
      "bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-md hover:shadow-lg hover:shadow-[#2563EB]/20",
    secondary:
      "bg-[#111827]/60 border border-[#1E293B] text-gray-300 hover:border-[#1E293B] hover:text-white",
    accent:
      "bg-[#2563EB]/10 border border-[#1E293B] text-[#2563EB] hover:bg-[#2563EB]/20",
    danger:
      "border border-transparent text-gray-500 hover:text-rose-400 hover:bg-rose-500/10",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3.5 py-2 rounded-[12px] text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]}`}
    >
      {label}
    </button>
  );
}
