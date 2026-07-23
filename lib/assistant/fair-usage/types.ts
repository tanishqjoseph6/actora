import type { PlanId } from "@/lib/subscription";

export type FairUsagePlanConfig = {
  planId: PlanId;
  /** Null = unlimited continuous Roxx AI usage */
  continuousLimitSeconds: number | null;
  cooldownSeconds: number;
  inactivityResetSeconds: number;
  enabled: boolean;
  unlimited: boolean;
};

export type RoxxFairUsageStatus = {
  allowed: boolean;
  inCooldown: boolean;
  unlimited: boolean;
  planId: PlanId;
  planName: string;
  upgradePlan: PlanId | null;
  sessionStartedAt: string | null;
  lastActivityAt: string | null;
  continuousSecondsUsed: number;
  continuousLimitSeconds: number | null;
  cooldownEndsAt: string | null;
  cooldownRemainingSeconds: number;
  inactivityResetSeconds: number;
  messageCount: number;
  totalTokens: number;
  lastModel: string | null;
};

export type RoxxSessionRow = {
  user_id: string;
  session_started_at: string;
  last_activity_at: string;
  cooldown_until: string | null;
  message_count: number;
  total_tokens: number;
  last_model: string | null;
  plan_id: string;
  updated_at: string;
};

export type SessionEndReason =
  | "limit_reached"
  | "inactivity_reset"
  | "cooldown_started";
