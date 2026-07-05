"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import type { NodeCategory, WorkflowNode } from "@/lib/automations/types";

const CATEGORY_STYLES: Record<NodeCategory, string> = {
  trigger: "from-violet-500/20 to-violet-600/10 border-violet-400/30",
  condition: "from-amber-500/20 to-amber-600/10 border-amber-400/30",
  ai: "from-[#3B82F6]/25 to-[#2563EB]/10 border-[#1E293B]",
  output: "from-emerald-500/20 to-emerald-600/10 border-emerald-400/30",
};

const CATEGORY_LABELS: Record<NodeCategory, string> = {
  trigger: "Trigger",
  condition: "Condition",
  ai: "AI Action",
  output: "Output",
};

type WorkflowNodeCardProps = {
  node: WorkflowNode;
  index: number;
  onRemove?: (id: string) => void;
  isOverlay?: boolean;
};

export function WorkflowNodeCard({
  node,
  index,
  onRemove,
  isOverlay,
}: WorkflowNodeCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id, disabled: isOverlay });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isOverlay ? 0.4 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout={!isOverlay}
      className={`
        relative w-full max-w-md mx-auto
        ${isOverlay ? "shadow-2xl " : ""}
      `}
    >
      <div
        className={`
          flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r border backdrop-blur-xl
          ${CATEGORY_STYLES[node.category]}
          hover:shadow-lg hover:shadow-black/20 transition-shadow
          cursor-grab active:cursor-grabbing
        `}
        {...attributes}
        {...listeners}
      >
        <div className="w-10 h-10 rounded-xl bg-[#05070B]/40 border border-[#1E293B] flex items-center justify-center text-lg shrink-0">
          {node.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-gray-400">
            {CATEGORY_LABELS[node.category]} · Step {index + 1}
          </p>
          <p className="text-sm font-semibold text-white truncate">{node.label}</p>
        </div>
        {onRemove && !isOverlay && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(node.id);
            }}
            className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
            aria-label={`Remove ${node.label}`}
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function WorkflowConnector({ animated = true }: { animated?: boolean }) {
  return (
    <div className="flex justify-center py-1 h-10 relative">
      <svg width="24" height="40" viewBox="0 0 24 40" className="overflow-visible">
        <defs>
          <linearGradient id="connectorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
        </defs>
        <line
          x1="12"
          y1="0"
          x2="12"
          y2="32"
          stroke="url(#connectorGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={animated ? "4 4" : undefined}
          className={animated ? "animate-[dash_1s_linear_infinite]" : ""}
        />
        <polygon points="12,40 6,30 18,30" fill="#2563EB" opacity="0.8" />
      </svg>
    </div>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
