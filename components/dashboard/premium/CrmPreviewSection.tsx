"use client";

import { PrefetchLink } from "@/components/dashboard/PrefetchLink";
import { motion } from "framer-motion";
import type { DashboardContactPreview } from "@/lib/dashboard/types";
import { CrmPreviewSkeleton } from "./CrmPreviewSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";
import { dashboard } from "./dashboard-tokens";

type CrmPreviewSectionProps = {
  contacts: DashboardContactPreview[];
  contactCount: number;
  loading?: boolean;
};

function getAiTier(score: number): { label: string; className: string } {
  if (score >= 90) return { label: "Hot", className: "text-[#93C5FD] bg-[#3B82F6]/20 border-[#3B82F6]/40" };
  if (score >= 80) return { label: "High", className: "text-[#3B82F6] bg-[#3B82F6]/15 border-[#3B82F6]/30" };
  if (score >= 70) return { label: "Medium", className: "text-[#A1A1AA] bg-[#111111] border-white/[0.06]" };
  return { label: "Low", className: "text-[#71717A] bg-[#111111] border-white/[0.06]" };
}

export function CrmPreviewSection({
  contacts,
  contactCount,
  loading = false,
}: CrmPreviewSectionProps) {
  const statusCounts = contacts.reduce<Record<string, number>>((acc, contact) => {
    acc[contact.status] = (acc[contact.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className={`${dashboard.cardLg} p-5 sm:p-6 lg:p-7`}
    >
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">CRM Overview</h2>
          <p className={`text-sm mt-0.5 ${dashboard.subtle}`}>
            {loading ? (
              <Skeleton className="h-4 w-48 inline-block" />
            ) : (
              `${contactCount} contact${contactCount === 1 ? "" : "s"} in your workspace`
            )}
          </p>
        </div>
        <PrefetchLink
          href="/dashboard/crm"
          className="text-xs font-medium text-[#2563EB] hover:text-[#93C5FD] transition-colors"
        >
          Open CRM →
        </PrefetchLink>
      </div>

      {Object.keys(statusCounts).length > 0 && (
        <div className="mb-6">
          <p className={`text-xs uppercase tracking-wider mb-3 ${dashboard.subtle}`}>Contact Status</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <span key={status} className={`text-sm capitalize ${dashboard.muted}`}>
                {status}: <span className="text-white font-semibold tabular-nums">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className={`text-xs uppercase tracking-wider mb-3 ${dashboard.subtle}`}>Top Contacts by AI Score</p>
        {loading ? (
          <CrmPreviewSkeleton />
        ) : contacts.length === 0 ? (
          <p className={`text-sm ${dashboard.subtle}`}>No contacts yet. Add contacts in CRM.</p>
        ) : (
          <ul className="space-y-2">
            {contacts.map((contact) => {
              const tier = getAiTier(contact.aiLeadScore);
              return (
                <li
                  key={contact.id}
                  className={`flex items-center justify-between gap-2 p-2.5 rounded-xl ${dashboard.cardBase} hover:border-[#3B82F6]/35 transition-colors`}
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{contact.name}</p>
                    <p className={`text-xs truncate ${dashboard.subtle}`}>
                      {contact.companyName ?? "No company"}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${tier.className}`}>
                    {contact.aiLeadScore}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </motion.section>
  );
}
