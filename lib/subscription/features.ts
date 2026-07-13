import type { PlanId } from "./types";

/** Premium capabilities gated by plan tier */
export type PlanFeature =
  | "automations"
  | "meetings"
  | "analytics"
  | "full_crm"
  | "shared_inbox"
  | "team_workspace";

export type PlanFeatureFlags = Record<PlanFeature, boolean>;

export const PLAN_FEATURES: Record<PlanId, PlanFeatureFlags> = {
  free: {
    automations: false,
    meetings: false,
    analytics: false,
    full_crm: false,
    shared_inbox: false,
    team_workspace: false,
  },
  /** Trial unlocks the same product surface as Pro (no Team-only features). */
  trial: {
    automations: true,
    meetings: true,
    analytics: true,
    full_crm: true,
    shared_inbox: false,
    team_workspace: false,
  },
  pro: {
    automations: true,
    meetings: true,
    analytics: true,
    full_crm: true,
    shared_inbox: false,
    team_workspace: false,
  },
  starter: {
    automations: true,
    meetings: true,
    analytics: true,
    full_crm: true,
    shared_inbox: true,
    team_workspace: true,
  },
  enterprise: {
    automations: true,
    meetings: true,
    analytics: true,
    full_crm: true,
    shared_inbox: true,
    team_workspace: true,
  },
};

export const FEATURE_META: Record<
  PlanFeature,
  { label: string; description: string; teamOnly?: boolean }
> = {
  automations: {
    label: "Automations",
    description: "Build AI workflows that run repetitive work automatically.",
  },
  meetings: {
    label: "Meetings",
    description: "Calendar view, upcoming meetings, and scheduling at a glance.",
  },
  analytics: {
    label: "Analytics",
    description: "Pipeline performance, inbox volume, and AI usage dashboards.",
  },
  full_crm: {
    label: "Full CRM",
    description: "Pipeline, deals, and companies — beyond basic contacts.",
  },
  shared_inbox: {
    label: "Shared Inbox",
    description: "Collaborate on email with your team in one shared workspace.",
    teamOnly: true,
  },
  team_workspace: {
    label: "Team Workspace",
    description: "Invite members, assign roles, and manage your org in Actora.",
    teamOnly: true,
  },
};

export function getPlanFeatures(planId: PlanId): PlanFeatureFlags {
  return PLAN_FEATURES[planId] ?? PLAN_FEATURES.free;
}

export function hasPlanFeature(planId: PlanId, feature: PlanFeature): boolean {
  return getPlanFeatures(planId)[feature];
}

/** Which paid plan unlocks this feature */
export function getFeatureUpgradePlan(feature: PlanFeature): PlanId {
  if (feature === "shared_inbox" || feature === "team_workspace") {
    return "starter";
  }
  return "pro";
}
