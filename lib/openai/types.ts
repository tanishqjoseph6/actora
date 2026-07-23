/**
 * Client-safe OpenAI / insights DTOs.
 * Keep the OpenAI SDK and server helpers out of this file.
 */

export type FollowUpSuggestion = {
  label: string;
  timing: string;
  draftHint: string;
};

export type NextActionSuggestion = {
  label: string;
  type: "reply" | "schedule" | "task" | "archive" | "follow_up";
};

export type EmailInsights = {
  priority: "high" | "medium" | "low";
  priorityReason: string;
  followUps: FollowUpSuggestion[];
  nextActions: NextActionSuggestion[];
};

export type CrmContactInsights = {
  summary: string;
  nextSteps: string[];
  riskLevel: "low" | "medium" | "high";
  engagementScore: number;
};
