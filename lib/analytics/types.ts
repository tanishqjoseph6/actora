export type AnalyticsPeriod = "7d" | "30d" | "90d";

export type TimeSeriesPoint = {
  label: string;
  value: number;
};

export type StageBreakdown = {
  stage: string;
  label: string;
  value: number;
  color: string;
};

export type ActivityItem = {
  id: string;
  type: "email" | "task" | "deal" | "meeting" | "ai";
  title: string;
  detail: string;
  timestamp: string;
};

export type AnalyticsSnapshot = {
  kpis: {
    pipelineValue: number;
    winRate: number;
    emailsProcessed: number;
    aiActions: number;
    activeDeals: number;
    avgAiScore: number;
  };
  pipelineTrend: TimeSeriesPoint[];
  emailVolume: TimeSeriesPoint[];
  aiUsage: TimeSeriesPoint[];
  pipelineByStage: StageBreakdown[];
  recentActivity: ActivityItem[];
};
