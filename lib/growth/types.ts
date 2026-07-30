export const REFERRAL_REWARDS = [
  {
    id: "tier_5",
    invitesRequired: 5,
    label: "Invite 5 friends",
    rewardLabel: "+7 days Pro",
    bonusDays: 7,
    planBoost: "pro" as const,
  },
  {
    id: "tier_50",
    invitesRequired: 50,
    label: "Invite 50 friends",
    rewardLabel: "+1 month Pro",
    bonusDays: 30,
    planBoost: "pro" as const,
  },
] as const;

export type ReferralStatus =
  | "pending"
  | "signed_up"
  | "activated"
  | "rewarded"
  | "expired";

export type ReferralProfile = {
  userId: string;
  code: string;
  successfulCount: number;
  pendingCount: number;
  rewardDaysEarned: number;
  rewardTierClaimed: {
    tier5: boolean;
    tier50: boolean;
  };
  createdAt: string;
};

export type ReferralRecord = {
  id: string;
  referrerUserId: string;
  referredUserId: string | null;
  referredEmail: string | null;
  status: ReferralStatus;
  code: string;
  signedUpAt: string | null;
  activatedAt: string | null;
  rewardedAt: string | null;
  createdAt: string;
};

export type AchievementId =
  | "first_ai_prompt"
  | "first_automation"
  | "first_teammate"
  | "first_task"
  | "first_crm_contact"
  | "connect_gmail"
  | "streak_7"
  | "streak_30"
  | "referral_5"
  | "workspace_progress_50"
  | "workspace_progress_100";

export type AchievementDefinition = {
  id: AchievementId;
  title: string;
  description: string;
  category: "product" | "team" | "growth" | "streak";
};

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: "first_ai_prompt",
    title: "First prompt",
    description: "Asked Roxx AI your first question.",
    category: "product",
  },
  {
    id: "first_automation",
    title: "Automation live",
    description: "Created your first automation workflow.",
    category: "product",
  },
  {
    id: "first_teammate",
    title: "Team builder",
    description: "Invited your first teammate.",
    category: "team",
  },
  {
    id: "first_task",
    title: "Action taken",
    description: "Created your first task.",
    category: "product",
  },
  {
    id: "first_crm_contact",
    title: "CRM started",
    description: "Added your first CRM contact.",
    category: "product",
  },
  {
    id: "connect_gmail",
    title: "Inbox connected",
    description: "Connected Gmail to Actora.",
    category: "product",
  },
  {
    id: "streak_7",
    title: "7-day streak",
    description: "Used Actora 7 days in a row.",
    category: "streak",
  },
  {
    id: "streak_30",
    title: "30-day streak",
    description: "Used Actora 30 days in a row.",
    category: "streak",
  },
  {
    id: "referral_5",
    title: "Referral champion",
    description: "Successfully referred 5 friends.",
    category: "growth",
  },
  {
    id: "workspace_progress_50",
    title: "Halfway there",
    description: "Completed 50% of workspace setup.",
    category: "product",
  },
  {
    id: "workspace_progress_100",
    title: "Fully set up",
    description: "Completed your workspace setup checklist.",
    category: "product",
  },
];

export type UserAchievement = {
  id: string;
  userId: string;
  achievementId: AchievementId;
  unlockedAt: string;
  metadata: Record<string, unknown>;
};

export type UserStreak = {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  totalActiveDays: number;
};

export type GrowthPreferences = {
  userId: string;
  emailOnboarding: boolean;
  emailProductUpdates: boolean;
  emailWeeklyDigest: boolean;
  emailReferralRewards: boolean;
  notifyReferrals: boolean;
  notifyInvites: boolean;
  notifyAutomations: boolean;
  notifyAiSummary: boolean;
  notifyProductUpdates: boolean;
};

export type GrowthDailyMetric = {
  userId: string;
  day: string;
  tasksCompleted: number;
  meetingsSummarized: number;
  aiPrompts: number;
  crmUpdates: number;
  documentsCreated: number;
  automationRuns: number;
};

export type OnboardingEmailStep =
  | "day_0"
  | "day_1"
  | "day_3"
  | "day_5"
  | "day_7"
  | "day_14";

export const ONBOARDING_EMAIL_STEPS: {
  step: OnboardingEmailStep;
  dayOffset: number;
  subject: string;
}[] = [
  { step: "day_0", dayOffset: 0, subject: "Welcome to Actora" },
  { step: "day_1", dayOffset: 1, subject: "Create your first workspace" },
  { step: "day_3", dayOffset: 3, subject: "Use Roxx AI today" },
  { step: "day_5", dayOffset: 5, subject: "Invite your teammates" },
  { step: "day_7", dayOffset: 7, subject: "Advanced workflows in Actora" },
  { step: "day_14", dayOffset: 14, subject: "Ready to upgrade Actora?" },
];

export type GrowthMetricKey =
  | "tasks_completed"
  | "meetings_summarized"
  | "ai_prompts"
  | "crm_updates"
  | "documents_created"
  | "automation_runs";
