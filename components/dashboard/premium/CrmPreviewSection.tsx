"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MOCK_PIPELINE_DEALS, PIPELINE_STAGES } from "@/lib/crm/pipeline";
import { MOCK_COMPANIES } from "@/lib/crm/mock-data";
import { dashboard } from "./dashboard-tokens";

const REVENUE_POINTS = [42, 48, 45, 58, 62, 71, 68, 84, 92, 88, 96, 104];

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
}

function getAiTier(score: number): { label: string; className: string } {
  if (score >= 90) return { label: "Hot", className: "text-[#93C5FD] bg-[#2563EB]/20 border-[#2563EB]/40" };
  if (score >= 80) return { label: "High", className: "text-[#3B82F6] bg-[#2563EB]/15 border-[#2563EB]/30" };
  if (score >= 70) return { label: "Medium", className: "text-[#94A3B8] bg-[#111827] border-[#1E293B]" };
  return { label: "Low", className: "text-[#64748B] bg-[#111827] border-[#1E293B]" };
}

export function CrmPreviewSection() {
  const stageCounts = PIPELINE_STAGES.map((stage) => ({
    ...stage,
    count: MOCK_PIPELINE_DEALS.filter((d) => d.stage === stage.id).length,
  }));

  const totalPipeline = MOCK_PIPELINE_DEALS.reduce((sum, d) => sum + d.value, 0);
  const hotLeads = [...MOCK_PIPELINE_DEALS]
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 4);

  const topCustomers = [...MOCK_COMPANIES]
    .filter((c) => c.revenue)
    .sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0))
    .slice(0, 3);

  const maxRev = Math.max(...REVENUE_POINTS);
  const revPath = REVENUE_POINTS.map((v, i) => {
    const x = (i / (REVENUE_POINTS.length - 1)) * 100;
    const y = 100 - (v / maxRev) * 80 - 10;
    return `${x},${y}`;
  }).join(" ");

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
          <p className={`text-sm mt-0.5 ${dashboard.subtle}`}>Pipeline & revenue at a glance</p>
        </div>
        <Link
          href="/dashboard/crm"
          className="text-xs font-medium text-[#2563EB] hover:text-[#93C5FD] transition-colors"
        >
          Open CRM →
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className={`text-xs uppercase tracking-wider ${dashboard.subtle}`}>Pipeline Value</p>
            <p className="text-2xl font-bold text-white tabular-nums">{formatCurrency(totalPipeline)}</p>
          </div>
          <span className="text-xs font-semibold text-[#3B82F6]">↑ 14%</span>
        </div>
        <svg viewBox="0 0 100 50" className="w-full h-16" preserveAspectRatio="none">
          <defs>
            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon fill="url(#revFill)" points={`0,50 ${revPath} 100,50`} />
          <polyline
            fill="none"
            stroke="#2563EB"
            strokeWidth="1.5"
            strokeLinecap="round"
            points={revPath}
          />
        </svg>
      </div>

      <div className="mb-6">
        <p className={`text-xs uppercase tracking-wider mb-3 ${dashboard.subtle}`}>Pipeline Stages</p>
        <div className="flex gap-1.5 h-2 rounded-full overflow-hidden bg-[#0B1220] border border-[#1E293B]">
          {stageCounts.map((stage) => (
            <div
              key={stage.id}
              className={`h-full ${stage.dot} opacity-80`}
              style={{ flex: Math.max(stage.count, 1) }}
              title={`${stage.label}: ${stage.count}`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          {stageCounts.filter((s) => s.count > 0).map((stage) => (
            <span key={stage.id} className={`text-[10px] ${dashboard.subtle}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${stage.dot} mr-1`} />
              {stage.label} ({stage.count})
            </span>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <p className={`text-xs uppercase tracking-wider mb-3 ${dashboard.subtle}`}>Hot Leads</p>
          <ul className="space-y-2">
            {hotLeads.map((deal) => {
              const tier = getAiTier(deal.aiScore);
              return (
                <li
                  key={deal.id}
                  className={`flex items-center justify-between gap-2 p-2.5 rounded-xl ${dashboard.cardBase} hover:border-[#2563EB]/35 transition-colors`}
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{deal.companyName}</p>
                    <p className={`text-xs truncate ${dashboard.subtle}`}>{deal.title}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${tier.className}`}>
                    {deal.aiScore}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <p className={`text-xs uppercase tracking-wider mb-3 ${dashboard.subtle}`}>Top Customers</p>
          <ul className="space-y-2">
            {topCustomers.map((company) => (
              <li
                key={company.id}
                className={`flex items-center justify-between gap-2 p-2.5 rounded-xl ${dashboard.cardBase}`}
              >
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{company.name}</p>
                  <p className={`text-xs ${dashboard.subtle}`}>{company.industry}</p>
                </div>
                <span className="text-xs font-semibold text-[#2563EB] tabular-nums shrink-0">
                  {company.revenue ? formatCurrency(company.revenue) : "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.section>
  );
}
