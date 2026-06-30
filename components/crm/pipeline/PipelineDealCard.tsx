"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { getAvatarGradient, getInitials } from "@/lib/avatar";
import { formatCurrency, formatDate } from "@/lib/crm/mock-data";
import {
  getAiScoreStyle,
  PRIORITY_STYLES,
  type PipelineDeal,
} from "@/lib/crm/pipeline";

type PipelineDealCardProps = {
  deal: PipelineDeal;
  isDragging?: boolean;
};

export function PipelineDealCard({ deal, isDragging }: PipelineDealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: deal.id, data: { type: "deal", deal } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragging = isDragging || isSortableDragging;
  const priorityStyle = PRIORITY_STYLES[deal.priority];
  const aiGradient = getAiScoreStyle(deal.aiScore);

  return (
    <motion.article
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: dragging ? 0.9 : 1, y: 0, scale: dragging ? 1.03 : 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`
        group relative rounded-2xl border backdrop-blur-sm cursor-grab active:cursor-grabbing
        bg-[#0d1730]/70 border-cyan-400/15 p-4
        hover:border-cyan-400/35 hover:shadow-lg hover:shadow-cyan-500/5
        ${dragging ? "z-50 shadow-2xl shadow-cyan-500/15 border-cyan-400/40 ring-2 ring-cyan-400/20" : ""}
      `}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarGradient(deal.companyName)} flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-md shadow-black/20`}
        >
          {getInitials(deal.companyName)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white text-sm leading-tight truncate">
            {deal.companyName}
          </h3>
          <p className="text-xs text-gray-400 truncate mt-0.5">{deal.title}</p>
        </div>
        <span
          className={`shrink-0 inline-flex px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide border ${priorityStyle.badge}`}
        >
          {priorityStyle.label}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
        <UserIcon className="w-3.5 h-3.5 text-cyan-400/60 shrink-0" />
        <span className="truncate">{deal.contactName}</span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#60A5FA] to-[#00CFFF]">
          {formatCurrency(deal.value)}
        </p>
        <div
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gradient-to-r ${aiGradient} bg-opacity-10 border border-white/10`}
          title="AI win probability score"
        >
          <SparkIcon className="w-3 h-3 text-white" />
          <span className="text-[10px] font-bold text-white">{deal.aiScore}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <CalendarIcon className="w-3 h-3" />
          {formatDate(deal.closeDate)}
        </span>
        <span>{deal.lastActivity}</span>
      </div>

      {deal.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {deal.labels.map((label) => (
            <span
              key={label}
              className="px-1.5 py-0.5 rounded-md bg-[#081226]/80 border border-cyan-400/10 text-[9px] text-gray-400"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-cyan-400/10">
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#00CFFF] flex items-center justify-center text-[8px] font-bold text-[#050816]">
          {getInitials(deal.owner)}
        </div>
        <span className="text-[10px] text-gray-500">{deal.owner}</span>
      </div>
    </motion.article>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}
