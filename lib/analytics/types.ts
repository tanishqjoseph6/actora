export type AnalyticsPeriod = "7d" | "30d" | "90d" | "12m";

export type AnalyticsWorkspaceFilter = "all" | "my";
export type AnalyticsMemberFilter = "all" | "me";

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
  type: "email" | "task" | "deal" | "meeting" | "ai" | "automation";
  title: string;
  detail: string;
  timestamp: string;
};

export type HealthRating = "excellent" | "good" | "average" | "needs_attention";

export type AnalyticsOverview = {
  emailsProcessed: number;
  aiRepliesGenerated: number;
  emailsSavedByAi: number;
  contacts: number;
  companies: number;
  deals: number;
  meetings: number;
  tasks: number;
  activeAutomations: number;
  roxxConversations: number;
  aiTimeSavedHours: number;
  workspaceHealthScore: number;
  healthRating: HealthRating;
};

export type EmailAnalytics = {
  emailsReceived: TimeSeriesPoint[];
  emailsReplied: TimeSeriesPoint[];
  aiRepliesVsManual: StageBreakdown[];
  avgResponseTimeHours: number;
  inboxZeroProgress: number;
  priorityEmailPercent: number;
  topCategories: StageBreakdown[];
  hasData: boolean;
};

export type CrmAnalytics = {
  contactsGrowth: TimeSeriesPoint[];
  companiesGrowth: TimeSeriesPoint[];
  dealsCreated: TimeSeriesPoint[];
  dealsWon: number;
  dealsLost: number;
  pipelineValue: number;
  conversionRate: number;
  winRate: number;
  avgDealSize: number;
  pipelineByStage: StageBreakdown[];
  hasData: boolean;
};

export type CalendarAnalytics = {
  meetingsThisWeek: number;
  meetingsThisMonth: number;
  hoursInMeetings: number;
  upcomingMeetings: number;
  completionRate: number;
  meetingsTrend: TimeSeriesPoint[];
  hasData: boolean;
};

export type TaskAnalytics = {
  completed: number;
  pending: number;
  overdue: number;
  productivityTrend: TimeSeriesPoint[];
  hasData: boolean;
};

export type AutomationAnalytics = {
  executed: number;
  successful: number;
  failed: number;
  timeSavedHours: number;
  mostUsed: { name: string; runs: number } | null;
  runsTrend: TimeSeriesPoint[];
  hasData: boolean;
};

export type RoxxAnalytics = {
  totalConversations: number;
  messagesSent: number;
  avgResponseTimeSec: number;
  actionsCompleted: number;
  topPrompts: { prompt: string; count: number }[];
  successRate: number;
  usageTrend: TimeSeriesPoint[];
  hasData: boolean;
};

export type ProductivityBreakdown = {
  inboxZero: number;
  crmActivity: number;
  tasksCompleted: number;
  meetingsAttended: number;
  automationUsage: number;
  roxxUsage: number;
};

export type AnalyticsSnapshot = {
  period: AnalyticsPeriod;
  generatedAt: string;
  overview: AnalyticsOverview;
  email: EmailAnalytics;
  crm: CrmAnalytics;
  calendar: CalendarAnalytics;
  tasks: TaskAnalytics;
  automations: AutomationAnalytics;
  roxx: RoxxAnalytics;
  productivity: ProductivityBreakdown;
  recentActivity: ActivityItem[];
  hasAnyData: boolean;
};

export type AnalyticsFilters = {
  period: AnalyticsPeriod;
  workspace: AnalyticsWorkspaceFilter;
  member: AnalyticsMemberFilter;
};
