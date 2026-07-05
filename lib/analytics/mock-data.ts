import { computePipelineMetrics, MOCK_PIPELINE_DEALS, PIPELINE_STAGES } from "@/lib/crm/pipeline";
import { formatCurrency } from "@/lib/crm/mock-data";
import type { AnalyticsPeriod, AnalyticsSnapshot } from "./types";

const STAGE_COLORS: Record<string, string> = {
  lead: "#64748B",
  qualified: "#3B82F6",
  proposal: "#2563EB",
  negotiation: "#1D4ED8",
  won: "#60A5FA",
  lost: "#475569",
};

function daysAgo(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

const PIPELINE_TREND_7D: AnalyticsSnapshot["pipelineTrend"] = [
  { label: "Mon", value: 312000 },
  { label: "Tue", value: 328000 },
  { label: "Wed", value: 341000 },
  { label: "Thu", value: 355000 },
  { label: "Fri", value: 368000 },
  { label: "Sat", value: 372000 },
  { label: "Sun", value: 384000 },
];

const PIPELINE_TREND_30D: AnalyticsSnapshot["pipelineTrend"] = [
  { label: "W1", value: 280000 },
  { label: "W2", value: 305000 },
  { label: "W3", value: 322000 },
  { label: "W4", value: 348000 },
  { label: "W5", value: 384000 },
];

const PIPELINE_TREND_90D: AnalyticsSnapshot["pipelineTrend"] = [
  { label: "Jan", value: 210000 },
  { label: "Feb", value: 245000 },
  { label: "Mar", value: 284000 },
  { label: "Apr", value: 312000 },
  { label: "May", value: 348000 },
  { label: "Jun", value: 384000 },
];

const EMAIL_7D = [
  { label: "Mon", value: 42 },
  { label: "Tue", value: 58 },
  { label: "Wed", value: 51 },
  { label: "Thu", value: 67 },
  { label: "Fri", value: 73 },
  { label: "Sat", value: 28 },
  { label: "Sun", value: 19 },
];

const EMAIL_30D = [
  { label: "W1", value: 312 },
  { label: "W2", value: 348 },
  { label: "W3", value: 391 },
  { label: "W4", value: 428 },
];

const EMAIL_90D = [
  { label: "Jan", value: 980 },
  { label: "Feb", value: 1120 },
  { label: "Mar", value: 1280 },
  { label: "Apr", value: 1410 },
  { label: "May", value: 1560 },
  { label: "Jun", value: 1680 },
];

const AI_7D = [
  { label: "Mon", value: 12 },
  { label: "Tue", value: 18 },
  { label: "Wed", value: 15 },
  { label: "Thu", value: 22 },
  { label: "Fri", value: 26 },
  { label: "Sat", value: 8 },
  { label: "Sun", value: 6 },
];

const AI_30D = [
  { label: "W1", value: 89 },
  { label: "W2", value: 104 },
  { label: "W3", value: 118 },
  { label: "W4", value: 132 },
];

const AI_90D = [
  { label: "Jan", value: 280 },
  { label: "Feb", value: 340 },
  { label: "Mar", value: 410 },
  { label: "Apr", value: 465 },
  { label: "May", value: 520 },
  { label: "Jun", value: 578 },
];

const RECENT_ACTIVITY: AnalyticsSnapshot["recentActivity"] = [
  {
    id: "a1",
    type: "ai",
    title: "AI reply drafted",
    detail: "Professional tone reply for Northwind Labs proposal thread",
    timestamp: daysAgo(1),
  },
  {
    id: "a2",
    type: "deal",
    title: "Deal stage updated",
    detail: "Meridian Health moved to Proposal Sent",
    timestamp: daysAgo(3),
  },
  {
    id: "a3",
    type: "email",
    title: "12 emails triaged",
    detail: "Inbox automation classified and prioritized incoming mail",
    timestamp: daysAgo(5),
  },
  {
    id: "a4",
    type: "task",
    title: "Task created",
    detail: "Follow up with Nova Finance pilot check-in",
    timestamp: daysAgo(8),
  },
  {
    id: "a5",
    type: "meeting",
    title: "Meeting scheduled",
    detail: "Enterprise demo with Northwind Labs — Thu 10:00 AM",
    timestamp: daysAgo(12),
  },
  {
    id: "a6",
    type: "ai",
    title: "Workflow executed",
    detail: "New email → summarize → create task automation ran",
    timestamp: daysAgo(18),
  },
];

function pipelineByStage(): AnalyticsSnapshot["pipelineByStage"] {
  const counts = Object.fromEntries(
    PIPELINE_STAGES.map((s) => [s.id, 0])
  ) as Record<string, number>;

  for (const deal of MOCK_PIPELINE_DEALS) {
    counts[deal.stage]++;
  }

  return PIPELINE_STAGES.map((s) => ({
    stage: s.id,
    label: s.label,
    value: counts[s.id],
    color: STAGE_COLORS[s.id] ?? "#64748B",
  })).filter((s) => s.value > 0);
}

export function getAnalyticsSnapshot(period: AnalyticsPeriod): AnalyticsSnapshot {
  const metrics = computePipelineMetrics(MOCK_PIPELINE_DEALS);

  const trendMap = {
    "7d": PIPELINE_TREND_7D,
    "30d": PIPELINE_TREND_30D,
    "90d": PIPELINE_TREND_90D,
  };
  const emailMap = { "7d": EMAIL_7D, "30d": EMAIL_30D, "90d": EMAIL_90D };
  const aiMap = { "7d": AI_7D, "30d": AI_30D, "90d": AI_90D };

  const emailTotal = emailMap[period].reduce((s, p) => s + p.value, 0);
  const aiTotal = aiMap[period].reduce((s, p) => s + p.value, 0);

  return {
    kpis: {
      pipelineValue: metrics.totalPipelineValue,
      winRate: metrics.winRate,
      emailsProcessed: emailTotal,
      aiActions: aiTotal,
      activeDeals: metrics.activeDeals,
      avgAiScore: metrics.avgAiScore,
    },
    pipelineTrend: trendMap[period],
    emailVolume: emailMap[period],
    aiUsage: aiMap[period],
    pipelineByStage: pipelineByStage(),
    recentActivity: RECENT_ACTIVITY,
  };
}

export function formatKpiCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return formatCurrency(value);
  return `$${value}`;
}

export function formatActivityTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
