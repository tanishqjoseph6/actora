"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { getAvatarGradient, getInitials } from "@/lib/avatar";
import { formatCurrency, formatDate } from "@/lib/crm/mock-data";
import {
  getAiScoreTier,
  PIPELINE_STAGES,
  PRIORITY_STYLES,
  type PipelineDeal,
} from "@/lib/crm/pipeline";

type PipelineDealDetailPanelProps = {
  deal: PipelineDeal | null;
  onClose: () => void;
};

export function PipelineDealDetailPanel({
  deal,
  onClose,
}: PipelineDealDetailPanelProps) {
  useEffect(() => {
    if (!deal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [deal, onClose]);

  const stageLabel =
    PIPELINE_STAGES.find((s) => s.id === deal?.stage)?.label ?? deal?.stage;

  return (
    <AnimatePresence>
      {deal && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:bg-black/40"
            onClick={onClose}
            aria-label="Close deal details"
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col border-l border-white/[0.06] bg-[#0A0A0A] shadow-2xl shadow-black/50"
            role="dialog"
            aria-modal
            aria-labelledby="deal-detail-title"
          >
            <header className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-white/[0.06] shrink-0">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getAvatarGradient(deal.companyName)} flex items-center justify-center text-sm font-bold text-white shrink-0`}
                >
                  {getInitials(deal.companyName)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-[#71717A]">
                    {deal.companyName}
                  </p>
                  <h2
                    id="deal-detail-title"
                    className="text-lg font-bold text-white mt-0.5 leading-snug"
                  >
                    {deal.title}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl border border-white/[0.06] text-[#71717A] hover:text-white hover:border-[#3B82F6]/40 transition-colors shrink-0"
                aria-label="Close"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto premium-scrollbar p-5 sm:p-6 space-y-6">
              <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
                <p className="text-xs uppercase tracking-wider text-[#71717A] mb-1">
                  Deal value
                </p>
                <p className="text-3xl font-bold text-white tabular-nums">
                  {formatCurrency(deal.value)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <DetailChip label="Stage" value={stageLabel ?? "—"} />
                <DetailChip
                  label="Priority"
                  value={PRIORITY_STYLES[deal.priority].label}
                />
                <DetailChip label="Close date" value={formatDate(deal.closeDate)} />
                <DetailChip label="Last activity" value={deal.lastActivity} />
              </div>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-3">
                  AI lead score
                </h3>
                <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${getAiScoreTier(deal.aiScore).badge}`}
                    >
                      {getAiScoreTier(deal.aiScore).label}
                    </span>
                    <span className="text-2xl font-bold text-white tabular-nums">
                      {deal.aiScore}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#0A0A0A] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#3B82F6] transition-all duration-500"
                      style={{ width: `${deal.aiScore}%` }}
                    />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-3">
                  People
                </h3>
                <div className="space-y-2">
                  <InfoRow label="Contact" value={deal.contactName} />
                  <InfoRow label="Owner" value={deal.owner} />
                </div>
              </section>

              {deal.labels.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-3">
                    Labels
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {deal.labels.map((label) => (
                      <span
                        key={label}
                        className="px-2.5 py-1 rounded-lg border border-white/[0.06] bg-[#0A0A0A] text-xs text-[#A1A1AA]"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <footer className="p-5 sm:p-6 border-t border-white/[0.06] shrink-0 flex flex-col sm:flex-row gap-2">
              <Link
                href={`/dashboard/crm/companies/${deal.companyId}`}
                className="flex-1 text-center py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-semibold transition-colors"
              >
                View company
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.06] text-[#A1A1AA] hover:text-white hover:border-[#3B82F6]/40 text-sm font-medium transition-colors"
              >
                Close
              </button>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function DetailChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-[#71717A]">{label}</p>
      <p className="text-sm font-medium text-white mt-0.5 truncate">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-white/[0.06] bg-[#111111]">
      <span className="text-sm text-[#71717A]">{label}</span>
      <span className="text-sm font-medium text-white truncate">{value}</span>
    </div>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
