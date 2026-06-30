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
      className="rounded-[20px] bg-[#071426]/70 border border-[#00D4FF]/10 backdrop-blur-xl p-4 sm:p-5 mb-4"
    >
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Workflow name"
            className="w-full text-lg font-semibold bg-transparent border-b border-[#00D4FF]/15 pb-2 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00D4FF]/40"
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

      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#00D4FF]/10">
        <ToolbarButton
          label={saving ? "Saving…" : "Save Draft"}
          onClick={onSaveDraft}
          disabled={!canSave || saving}
          variant="secondary"
        />
        <ToolbarButton
          label="Publish"
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
      "bg-gradient-to-r from-[#4F8CFF] to-[#00D4FF] text-[#050816] shadow-md shadow-[#00D4FF]/15 hover:shadow-[#00D4FF]/30",
    secondary:
      "bg-[#0B1730]/60 border border-[#00D4FF]/15 text-gray-300 hover:border-[#00D4FF]/30 hover:text-white",
    accent:
      "bg-[#00D4FF]/10 border border-[#00D4FF]/30 text-[#00D4FF] hover:bg-[#00D4FF]/20",
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
