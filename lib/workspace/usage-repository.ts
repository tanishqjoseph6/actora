import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getStoredSubscription } from "@/lib/subscription/repository";
import { getPlanLimits } from "@/lib/subscription/plans";
import { getUserUsage } from "@/lib/dashboard/user-usage";
import { getWorkspaceStorageSnapshot } from "@/lib/storage/repository";
import { getPublicApiMonthStart, getPublicApiNextReset } from "@/lib/public-api/limits";
import type { PlanId } from "@/components/billing/pricing-data";

export type WorkspaceUsageSnapshot = {
  planId: PlanId;
  nextResetAt: string;
  storage: { usedBytes: number; limitBytes: number; fileCount: number; percent: number; remainingBytes: number };
  api: { callsUsed: number; monthlyLimit: number; rateLimit: number; remaining: number | null; percent: number; activeKeys: number };
  aiCredits: { used: number; limit: number; remaining: number; percent: number };
  teamMembers: { used: number; limit: number; remaining: number | null; percent: number };
  workspaces: { used: number; limit: number; remaining: number | null; percent: number };
  automationRuns: number;
  tasks: number;
  documents: number;
  crmContacts: number;
  meetings: number;
  calendarEvents: number;
};

async function countRows(db: NonNullable<ReturnType<typeof getSupabaseAdmin>>, table: string, column: string, value: string) {
  try {
    const result = await db.from(table).select("*", { count: "exact", head: true }).eq(column, value);
    return result.error ? 0 : result.count ?? 0;
  } catch {
    return 0;
  }
}

function percent(used: number, limit: number) {
  return Number.isFinite(limit) && limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
}

export async function getWorkspaceUsage(workspaceId: string, userId: string): Promise<WorkspaceUsageSnapshot> {
  const db = getSupabaseAdmin();
  const subscription = await getStoredSubscription(userId);
  const planId = (subscription?.planId ?? "free") as PlanId;
  const limits = getPlanLimits(planId);
  const storage = await getWorkspaceStorageSnapshot(workspaceId, userId);
  const monthStart = getPublicApiMonthStart().slice(0, 10);

  if (!db) {
    return emptyUsage(planId, subscription?.currentPeriodEnd, storage, limits);
  }

  const [apiResult, activeKeysResult, members, workspaces, automationRuns, tasks, documents, crmContacts, meetings, calendarEvents, aiUsage] = await Promise.all([
    db.from("api_usage_monthly").select("calls_count").eq("workspace_id", workspaceId).eq("month_start", monthStart),
    db.from("api_keys").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).is("revoked_at", null),
    countRows(db, "workspace_members", "workspace_id", workspaceId),
    countRows(db, "workspace_members", "user_id", userId),
    countRows(db, "workflow_runs", "user_id", userId),
    countRows(db, "tasks", "user_id", userId),
    countRows(db, "workspace_files", "workspace_id", workspaceId),
    countRows(db, "crm_contacts", "user_id", userId),
    countRows(db, "meetings", "user_id", userId),
    countRows(db, "calendar_events", "user_id", userId),
    getUserUsage(userId),
  ]);
  const apiCalls = (apiResult.data ?? []).reduce((total, row) => total + Number(row.calls_count ?? 0), 0);
  const aiUsed = aiUsage.aiActionsUsed;
  const nextResetAt = subscription?.currentPeriodEnd ?? getPublicApiNextReset();
  return {
    planId,
    nextResetAt,
    storage: { usedBytes: storage.usedBytes, limitBytes: storage.limitBytes, fileCount: storage.fileCount, remainingBytes: Math.max(0, storage.limitBytes - storage.usedBytes), percent: percent(storage.usedBytes, storage.limitBytes) },
    api: { callsUsed: apiCalls, monthlyLimit: limits.publicApiCallsPerMonth, rateLimit: limits.publicApiRequestsPerMinute, remaining: Number.isFinite(limits.publicApiCallsPerMonth) ? Math.max(0, limits.publicApiCallsPerMonth - apiCalls) : null, percent: percent(apiCalls, limits.publicApiCallsPerMonth), activeKeys: activeKeysResult.count ?? 0 },
    aiCredits: { used: aiUsed, limit: limits.aiActionsPerMonth, remaining: Number.isFinite(limits.aiActionsPerMonth) ? Math.max(0, limits.aiActionsPerMonth - aiUsed) : 0, percent: percent(aiUsed, limits.aiActionsPerMonth) },
    teamMembers: { used: members, limit: planId === "free" || planId === "trial" ? 1 : planId === "pro" ? 10 : Infinity, remaining: null, percent: percent(members, planId === "free" || planId === "trial" ? 1 : planId === "pro" ? 10 : Infinity) },
    workspaces: { used: workspaces, limit: planId === "enterprise" ? Infinity : 1, remaining: null, percent: percent(workspaces, planId === "enterprise" ? Infinity : 1) },
    automationRuns,
    tasks,
    documents,
    crmContacts,
    meetings,
    calendarEvents,
  };
}

function emptyUsage(planId: PlanId, periodEnd: string | undefined, storage: Awaited<ReturnType<typeof getWorkspaceStorageSnapshot>>, limits: ReturnType<typeof getPlanLimits>): WorkspaceUsageSnapshot {
  return {
    planId, nextResetAt: periodEnd ?? getPublicApiNextReset(),
    storage: { usedBytes: storage.usedBytes, limitBytes: storage.limitBytes, fileCount: storage.fileCount, remainingBytes: storage.limitBytes, percent: 0 },
    api: { callsUsed: 0, monthlyLimit: limits.publicApiCallsPerMonth, rateLimit: limits.publicApiRequestsPerMinute, remaining: Number.isFinite(limits.publicApiCallsPerMonth) ? limits.publicApiCallsPerMonth : null, percent: 0, activeKeys: 0 },
    aiCredits: { used: 0, limit: limits.aiActionsPerMonth, remaining: limits.aiActionsPerMonth, percent: 0 },
    teamMembers: { used: 0, limit: 1, remaining: 1, percent: 0 },
    workspaces: { used: 0, limit: 1, remaining: 1, percent: 0 },
    automationRuns: 0, tasks: 0, documents: 0, crmContacts: 0, meetings: 0, calendarEvents: 0,
  };
}
