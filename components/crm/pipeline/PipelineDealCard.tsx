"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getAvatarGradient, getInitials } from "@/lib/avatar";
import { formatCurrency, formatDate } from "@/lib/crm/mock-data";
import {
  getAiScoreTier,
  PRIORITY_STYLES,
  type PipelineDeal,
} from "@/lib/crm/pipeline";

type PipelineDealCardProps = {
  deal: PipelineDeal;
  isSelected?: boolean;
  onSelect?: (deal: PipelineDeal) => void;
};

export function PipelineDealCard({
  deal,
  isSelected,
  onSelect,
}: PipelineDealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id, data: { type: "deal", deal } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? "transform 200ms cubic-bezier(0.2, 0, 0, 1)",
  };

  const priorityStyle = PRIORITY_STYLES[deal.priority];
  const aiTier = getAiScoreTier(deal.aiScore);

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`
        group relative interactive-lift transition-all duration-200
        rounded-xl border bg-[#111111] shadow-sm
        ${isDragging ? "opacity-40 scale-[0.98]" : "opacity-100"}
        ${isSelected ? "border-[#3B82F6]/60 ring-1 ring-[#2563EB]/25" : "border-white/[0.06] hover:border-[#3B82F6]/35"}
      `}
    >
      <div className="flex items-stretch">
        <button
          type="button"
          ref={setActivatorNodeRef}
          className="flex items-center justify-center w-8 shrink-0 rounded-l-xl border-r border-white/[0.06] text-[#71717A] hover:text-[#A1A1AA] hover:bg-[#0A0A0A] cursor-grab active:cursor-grabbing touch-none"
          aria-label={`Drag ${deal.title}`}
          {...attributes}
          {...listeners}
        >
          <GripIcon className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onSelect?.(deal)}
          className="flex-1 text-left p-3.5 min-w-0"
        >
          <div className="flex items-start gap-2.5 mb-2.5">
            <div
              className={`w-9 h-9 rounded-lg bg-gradient-to-br ${getAvatarGradient(deal.companyName)} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}
            >
              {getInitials(deal.companyName)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-white text-sm leading-tight truncate">
                {deal.companyName}
              </h3>
              <p className="text-xs text-[#71717A] truncate mt-0.5">{deal.title}</p>
            </div>
            <span
              className={`shrink-0 inline-flex px-1.5 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wide border ${priorityStyle.badge}`}
            >
              {priorityStyle.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mb-2.5 text-xs text-[#A1A1AA]">
            <UserIcon className="w-3 h-3 text-[#71717A] shrink-0" />
            <span className="truncate">{deal.contactName}</span>
          </div>

          <div className="flex items-center justify-between gap-2 mb-2.5">
            <p className="text-sm font-bold text-white tabular-nums">
              {formatCurrency(deal.value)}
            </p>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold ${aiTier.badge}`}
            >
              <SparkIcon className="w-3 h-3 shrink-0 opacity-80" />
              {deal.aiScore}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#71717A]">
            <span className="flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              {formatDate(deal.closeDate)}
            </span>
            <span>{deal.lastActivity}</span>
          </div>

          {deal.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5 pt-2.5 border-t border-white/[0.06]">
              {deal.labels.slice(0, 3).map((label) => (
                <span
                  key={label}
                  className="px-1.5 py-0.5 rounded-md bg-[#0A0A0A] border border-white/[0.06] text-[9px] text-[#71717A]"
                >
                  {label}
                </span>
              ))}
              {deal.labels.length > 3 && (
                <span className="text-[9px] text-[#71717A]">+{deal.labels.length - 3}</span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-white/[0.06]">
            <div className="w-5 h-5 rounded-md bg-[#3B82F6] flex items-center justify-center text-[8px] font-bold text-white">
              {getInitials(deal.owner)}
            </div>
            <span className="text-[10px] text-[#71717A]">{deal.owner}</span>
          </div>
        </button>
      </div>
    </article>
  );
}

export function PipelineDealCardOverlay({ deal }: { deal: PipelineDeal }) {
  const priorityStyle = PRIORITY_STYLES[deal.priority];
  const aiTier = getAiScoreTier(deal.aiScore);

  return (
    <div className="rounded-xl border border-[#3B82F6]/50 bg-[#111111] p-3.5 shadow-xl shadow-black/40 w-[280px] cursor-grabbing rotate-[1.5deg]">
      <div className="flex items-start gap-2.5 mb-2">
        <div
          className={`w-9 h-9 rounded-lg bg-gradient-to-br ${getAvatarGradient(deal.companyName)} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}
        >
          {getInitials(deal.companyName)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white text-sm truncate">{deal.companyName}</h3>
          <p className="text-xs text-[#71717A] truncate">{deal.title}</p>
        </div>
        <span
          className={`shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase border ${priorityStyle.badge}`}
        >
          {priorityStyle.label}
        </span>
      </div>
      <p className="text-sm font-bold text-white mb-1">{formatCurrency(deal.value)}</p>
      <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-md border ${aiTier.badge}`}>
        {aiTier.label} · {deal.aiScore}
      </span>
    </div>
  );
}

function GripIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <circle cx="5" cy="4" r="1.25" />
      <circle cx="11" cy="4" r="1.25" />
      <circle cx="5" cy="8" r="1.25" />
      <circle cx="11" cy="8" r="1.25" />
      <circle cx="5" cy="12" r="1.25" />
      <circle cx="11" cy="12" r="1.25" />
    </svg>
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
