import type { DealStage } from "./types";
import { MOCK_COMPANIES } from "./mock-data";

export type DealPriority = "high" | "medium" | "low";

export type AiScoreTier = "hot" | "high" | "medium" | "low" | "cold";

export type PipelineSort = "value-desc" | "close-date" | "ai-score";

export type PipelineDeal = {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  contactName: string;
  stage: DealStage;
  value: number;
  closeDate: string;
  priority: DealPriority;
  owner: string;
  lastActivity: string;
  aiScore: number;
  labels: string[];
};

export const PIPELINE_STAGES: {
  id: DealStage;
  label: string;
  accent: string;
  dot: string;
}[] = [
  {
    id: "lead",
    label: "Lead",
    accent: "from-[#1E293B] to-[#0B1220]",
    dot: "bg-[#64748B]",
  },
  {
    id: "qualified",
    label: "Qualified",
    accent: "from-[#2563EB]/20 to-[#1D4ED8]/10",
    dot: "bg-[#3B82F6]",
  },
  {
    id: "proposal",
    label: "Proposal Sent",
    accent: "from-[#2563EB]/25 to-[#1D4ED8]/15",
    dot: "bg-[#2563EB]",
  },
  {
    id: "negotiation",
    label: "Negotiation",
    accent: "from-[#1D4ED8]/20 to-[#2563EB]/10",
    dot: "bg-[#1D4ED8]",
  },
  {
    id: "won",
    label: "Won",
    accent: "from-[#2563EB]/30 to-[#3B82F6]/10",
    dot: "bg-[#60A5FA]",
  },
  {
    id: "lost",
    label: "Lost",
    accent: "from-[#1E293B] to-[#111827]",
    dot: "bg-[#475569]",
  },
];

export const PIPELINE_OWNERS = ["Tanishq", "Alex Rivera", "Sam Okonkwo"] as const;

export const PIPELINE_COMPANIES = MOCK_COMPANIES.map((c) => ({
  id: c.id,
  name: c.name,
}));

export const AI_SCORE_FILTER_OPTIONS = [
  { value: "all", label: "All scores" },
  { value: "hot", label: "Hot (90+)" },
  { value: "high", label: "High (80–89)" },
  { value: "medium", label: "Medium (60–79)" },
  { value: "low", label: "Low (40–59)" },
  { value: "cold", label: "Below 40" },
] as const;

const OPEN_STAGES: DealStage[] = ["lead", "qualified", "proposal", "negotiation"];

export function getAiScoreTier(score: number): {
  tier: AiScoreTier;
  label: string;
  badge: string;
  gradient: string;
} {
  if (score >= 90) {
    return {
      tier: "hot",
      label: "Hot",
      badge: "bg-[#2563EB]/20 border-[#3B82F6]/40 text-[#93C5FD]",
      gradient: "from-[#3B82F6] to-[#2563EB]",
    };
  }
  if (score >= 80) {
    return {
      tier: "high",
      label: "High",
      badge: "bg-[#2563EB]/15 border-[#2563EB]/40 text-[#BFDBFE]",
      gradient: "from-[#2563EB] to-[#1D4ED8]",
    };
  }
  if (score >= 60) {
    return {
      tier: "medium",
      label: "Medium",
      badge: "bg-[#1E293B] border-[#334155] text-[#94A3B8]",
      gradient: "from-[#3B82F6] to-[#2563EB]",
    };
  }
  if (score >= 40) {
    return {
      tier: "low",
      label: "Low",
      badge: "bg-[#0B1220] border-[#1E293B] text-[#64748B]",
      gradient: "from-[#64748B] to-[#475569]",
    };
  }
  return {
    tier: "cold",
    label: "Cold",
    badge: "bg-[#0B1220] border-[#1E293B] text-[#475569]",
    gradient: "from-[#475569] to-[#334155]",
  };
}

export function getAiScoreStyle(score: number): string {
  return getAiScoreTier(score).gradient;
}

export function computePipelineMetrics(deals: PipelineDeal[]) {
  const open = deals.filter((d) => OPEN_STAGES.includes(d.stage));
  const won = deals.filter((d) => d.stage === "won");
  const lost = deals.filter((d) => d.stage === "lost");
  const openValue = open.reduce((sum, d) => sum + d.value, 0);
  const avgAiScore =
    deals.length > 0
      ? Math.round(deals.reduce((sum, d) => sum + d.aiScore, 0) / deals.length)
      : 0;
  const closedCount = won.length + lost.length;
  const winRate =
    closedCount > 0 ? Math.round((won.length / closedCount) * 100) : 0;

  return {
    totalPipelineValue: openValue,
    dealsWon: won.length,
    dealsLost: lost.length,
    avgAiScore,
    activeDeals: open.length,
    winRate,
  };
}

export const MOCK_PIPELINE_DEALS: PipelineDeal[] = [
  {
    id: "d1",
    title: "Enterprise rollout",
    companyId: "co1",
    companyName: "Northwind Labs",
    contactName: "Sarah Chen",
    stage: "negotiation",
    value: 120000,
    closeDate: "2026-07-15",
    priority: "high",
    owner: "Tanishq",
    lastActivity: "2 hours ago",
    aiScore: 87,
    labels: ["Enterprise", "Multi-year"],
  },
  {
    id: "d2",
    title: "Growth team seats",
    companyId: "co2",
    companyName: "Brightpath",
    contactName: "Marcus Webb",
    stage: "proposal",
    value: 42000,
    closeDate: "2026-07-30",
    priority: "medium",
    owner: "Tanishq",
    lastActivity: "Yesterday",
    aiScore: 62,
    labels: ["Inbound", "Marketing"],
  },
  {
    id: "d3",
    title: "Dev tools integration",
    companyId: "co4",
    companyName: "Stackline",
    contactName: "James Okafor",
    stage: "qualified",
    value: 28000,
    closeDate: "2026-08-12",
    priority: "medium",
    owner: "Alex Rivera",
    lastActivity: "3 days ago",
    aiScore: 54,
    labels: ["Technical", "API"],
  },
  {
    id: "d4",
    title: "HIPAA workspace",
    companyId: "co5",
    companyName: "Meridian Health",
    contactName: "Elena Rodriguez",
    stage: "proposal",
    value: 95000,
    closeDate: "2026-08-01",
    priority: "high",
    owner: "Tanishq",
    lastActivity: "5 hours ago",
    aiScore: 78,
    labels: ["Healthcare", "Compliance"],
  },
  {
    id: "d5",
    title: "Pilot expansion",
    companyId: "co7",
    companyName: "Nova Finance",
    contactName: "Aisha Khan",
    stage: "lead",
    value: 36000,
    closeDate: "2026-09-05",
    priority: "low",
    owner: "Sam Okonkwo",
    lastActivity: "1 week ago",
    aiScore: 41,
    labels: ["Fintech", "Pilot"],
  },
  {
    id: "d6",
    title: "Agency partnership",
    companyId: "co8",
    companyName: "Orbit Media",
    contactName: "David Park",
    stage: "qualified",
    value: 54000,
    closeDate: "2026-07-22",
    priority: "medium",
    owner: "Alex Rivera",
    lastActivity: "Today",
    aiScore: 69,
    labels: ["Partner", "Agency"],
  },
  {
    id: "d7",
    title: "Add-on AI credits",
    companyId: "co1",
    companyName: "Northwind Labs",
    contactName: "Sarah Chen",
    stage: "won",
    value: 65000,
    closeDate: "2026-05-18",
    priority: "high",
    owner: "Tanishq",
    lastActivity: "2 weeks ago",
    aiScore: 95,
    labels: ["Upsell", "AI"],
  },
  {
    id: "d8",
    title: "Renewal",
    companyId: "co6",
    companyName: "Cascade Retail",
    contactName: "Tom Hughes",
    stage: "lost",
    value: 18000,
    closeDate: "2026-04-02",
    priority: "low",
    owner: "Sam Okonkwo",
    lastActivity: "1 month ago",
    aiScore: 22,
    labels: ["Churned"],
  },
  {
    id: "d9",
    title: "Series B workspace",
    companyId: "co3",
    companyName: "Atlas Ventures",
    contactName: "Priya Sharma",
    stage: "lead",
    value: 72000,
    closeDate: "2026-09-20",
    priority: "high",
    owner: "Tanishq",
    lastActivity: "4 hours ago",
    aiScore: 58,
    labels: ["VC", "Warm intro"],
  },
  {
    id: "d10",
    title: "Sales team rollout",
    companyId: "co2",
    companyName: "Brightpath",
    contactName: "Marcus Webb",
    stage: "lead",
    value: 24000,
    closeDate: "2026-08-28",
    priority: "medium",
    owner: "Alex Rivera",
    lastActivity: "6 days ago",
    aiScore: 47,
    labels: ["Expansion"],
  },
  {
    id: "d11",
    title: "Security review package",
    companyId: "co5",
    companyName: "Meridian Health",
    contactName: "Elena Rodriguez",
    stage: "negotiation",
    value: 88000,
    closeDate: "2026-07-08",
    priority: "high",
    owner: "Tanishq",
    lastActivity: "30 min ago",
    aiScore: 82,
    labels: ["Security", "Enterprise"],
  },
  {
    id: "d12",
    title: "Starter migration",
    companyId: "co4",
    companyName: "Stackline",
    contactName: "James Okafor",
    stage: "won",
    value: 32000,
    closeDate: "2026-06-10",
    priority: "medium",
    owner: "Alex Rivera",
    lastActivity: "3 weeks ago",
    aiScore: 91,
    labels: ["Migration"],
  },
];

export const PRIORITY_STYLES: Record<
  DealPriority,
  { badge: string; label: string }
> = {
  high: {
    badge: "bg-[#2563EB]/20 border-[#3B82F6]/35 text-[#93C5FD]",
    label: "High",
  },
  medium: {
    badge: "bg-[#1E293B] border-[#334155] text-[#94A3B8]",
    label: "Medium",
  },
  low: {
    badge: "bg-[#0B1220] border-[#1E293B] text-[#64748B]",
    label: "Low",
  },
};

export function sortPipelineDeals(
  deals: PipelineDeal[],
  sort: PipelineSort
): PipelineDeal[] {
  const sorted = [...deals];
  switch (sort) {
    case "value-desc":
      return sorted.sort((a, b) => b.value - a.value);
    case "close-date":
      return sorted.sort(
        (a, b) =>
          new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime()
      );
    case "ai-score":
      return sorted.sort((a, b) => b.aiScore - a.aiScore);
    default:
      return sorted;
  }
}

export function filterPipelineDeals(
  deals: PipelineDeal[],
  {
    search,
    owner,
    companyId,
    priority,
    stage,
    aiScoreTier,
  }: {
    search: string;
    owner: string;
    companyId: string;
    priority: string;
    stage: string;
    aiScoreTier: string;
  }
): PipelineDeal[] {
  const query = search.trim().toLowerCase();
  return deals.filter((deal) => {
    if (owner !== "all" && deal.owner !== owner) return false;
    if (companyId !== "all" && deal.companyId !== companyId) return false;
    if (priority !== "all" && deal.priority !== priority) return false;
    if (stage !== "all" && deal.stage !== stage) return false;
    if (aiScoreTier !== "all") {
      const tier = getAiScoreTier(deal.aiScore).tier;
      if (tier !== aiScoreTier) return false;
    }
    if (!query) return true;
    return (
      deal.title.toLowerCase().includes(query) ||
      deal.companyName.toLowerCase().includes(query) ||
      deal.contactName.toLowerCase().includes(query) ||
      deal.owner.toLowerCase().includes(query) ||
      deal.labels.some((l) => l.toLowerCase().includes(query))
    );
  });
}
