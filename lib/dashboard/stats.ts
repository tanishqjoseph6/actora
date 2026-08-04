import { gmailAccountRepository } from "@/lib/gmail/repository";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  EMPTY_DASHBOARD_DATA,
  type DashboardAutomationPreview,
  type DashboardContactPreview,
  type DashboardData,
  type DashboardMeetingPreview,
} from "./types";

function debugDashboardLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>
) {
  // #region agent log
  fetch("http://127.0.0.1:7591/ingest/ba758f26-6384-42d0-bcfa-81310e1b9c4c",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"5e59d5"},body:JSON.stringify({sessionId:"5e59d5",runId:"initial",hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});
  // #endregion
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}


async function countContacts(userId: string): Promise<number> {
  try {
    const db = getSupabaseAdmin();
    if (!db) return 0;

    const { count, error } = await db
      .from("crm_contacts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) {
      console.error("[dashboard] countContacts failed:", error.message);
      debugDashboardLog("H3", "lib/dashboard/stats.ts:countContacts", "crm_contacts count query failed", {errorMessage:error.message});
      return 0;
    }

    debugDashboardLog("H3", "lib/dashboard/stats.ts:countContacts", "crm_contacts count query completed", {count:count ?? 0});
    return count ?? 0;
  } catch (error) {
    console.error("[dashboard] countContacts exception:", error);
    debugDashboardLog("H3", "lib/dashboard/stats.ts:countContacts", "crm_contacts count query threw", {errorName:error instanceof Error?error.name:"unknown",errorMessage:error instanceof Error?error.message:String(error)});
    return 0;
  }
}

async function countMeetings(userId: string): Promise<number> {
  try {
    const db = getSupabaseAdmin();
    if (!db) return 0;

    const { count, error } = await db
      .from("meetings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .neq("status", "cancelled");

    if (error) {
      console.error("[dashboard] countMeetings failed:", error.message);
      debugDashboardLog("H3", "lib/dashboard/stats.ts:countMeetings", "meetings count query failed", {errorMessage:error.message});
      return 0;
    }

    debugDashboardLog("H3", "lib/dashboard/stats.ts:countMeetings", "meetings count query completed", {count:count ?? 0});
    return count ?? 0;
  } catch (error) {
    console.error("[dashboard] countMeetings exception:", error);
    debugDashboardLog("H3", "lib/dashboard/stats.ts:countMeetings", "meetings count query threw", {errorName:error instanceof Error?error.name:"unknown",errorMessage:error instanceof Error?error.message:String(error)});
    return 0;
  }
}

async function listTodaysMeetings(
  userId: string
): Promise<DashboardMeetingPreview[]> {
  try {
    const db = getSupabaseAdmin();
    if (!db) return [];

    const { data, error } = await db
      .from("meetings")
      .select("id, title, starts_at, status")
      .eq("user_id", userId)
      .neq("status", "cancelled")
      .gte("starts_at", startOfToday().toISOString())
      .lte("starts_at", endOfToday().toISOString())
      .order("starts_at", { ascending: true });

    if (error) {
      console.error("[dashboard] listTodaysMeetings failed:", error.message);
      debugDashboardLog("H3", "lib/dashboard/stats.ts:listTodaysMeetings", "meetings list query failed", {errorMessage:error.message});
      return [];
    }

    debugDashboardLog("H3", "lib/dashboard/stats.ts:listTodaysMeetings", "meetings list query completed", {rows:data?.length ?? 0});
    return (data ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      startsAt: row.starts_at as string,
      status: row.status as string,
    }));
  } catch (error) {
    console.error("[dashboard] listTodaysMeetings exception:", error);
    debugDashboardLog("H3", "lib/dashboard/stats.ts:listTodaysMeetings", "meetings list query threw", {errorName:error instanceof Error?error.name:"unknown",errorMessage:error instanceof Error?error.message:String(error)});
    return [];
  }
}

async function listTopContacts(
  userId: string
): Promise<DashboardContactPreview[]> {
  try {
    const db = getSupabaseAdmin();
    if (!db) return [];

    const { data, error } = await db
      .from("crm_contacts")
      .select("id, name, company_name, ai_lead_score, status")
      .eq("user_id", userId)
      .order("ai_lead_score", { ascending: false })
      .limit(4);

    if (error) {
      console.error("[dashboard] listTopContacts failed:", error.message);
      debugDashboardLog("H3", "lib/dashboard/stats.ts:listTopContacts", "crm_contacts list query failed", {errorMessage:error.message});
      return [];
    }

    debugDashboardLog("H3", "lib/dashboard/stats.ts:listTopContacts", "crm_contacts list query completed", {rows:data?.length ?? 0});
    return (data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      companyName: (row.company_name as string | null) ?? null,
      aiLeadScore: (row.ai_lead_score as number) ?? 0,
      status: row.status as string,
    }));
  } catch (error) {
    console.error("[dashboard] listTopContacts exception:", error);
    debugDashboardLog("H3", "lib/dashboard/stats.ts:listTopContacts", "crm_contacts list query threw", {errorName:error instanceof Error?error.name:"unknown",errorMessage:error instanceof Error?error.message:String(error)});
    return [];
  }
}

async function listAutomationPreviews(
  userId: string
): Promise<DashboardAutomationPreview[]> {
  const db = getSupabaseAdmin();
  if (!db) return [];

  try {
    const { data: workflows, error: workflowError } = await db
      .from("workflows")
      .select("id, name, status, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(5);

    if (workflowError) {
      console.error("[dashboard] listAutomationPreviews workflows failed:", workflowError.message);
      debugDashboardLog("H3", "lib/dashboard/stats.ts:listAutomationPreviews", "workflows list query failed", {errorMessage:workflowError.message});
      return [];
    }

    debugDashboardLog("H3", "lib/dashboard/stats.ts:listAutomationPreviews", "workflows list query completed", {rows:workflows?.length ?? 0});
    const workflowIds = (workflows ?? []).map((w) => w.id as string);
    if (workflowIds.length === 0) return [];

    const { data: runs, error: runsError } = await db
      .from("workflow_runs")
      .select("workflow_id, started_at")
      .eq("user_id", userId)
      .in("workflow_id", workflowIds)
      .gte("started_at", startOfToday().toISOString());

    if (runsError) {
      console.error("[dashboard] listAutomationPreviews runs failed:", runsError.message);
      debugDashboardLog("H3", "lib/dashboard/stats.ts:listAutomationPreviews", "workflow_runs list query failed", {errorMessage:runsError.message});
    }

    const runsTodayByWorkflow = new Map<string, number>();
    for (const run of runs ?? []) {
      const workflowId = run.workflow_id as string;
      runsTodayByWorkflow.set(
        workflowId,
        (runsTodayByWorkflow.get(workflowId) ?? 0) + 1
      );
    }

    return (workflows ?? []).map((workflow) => ({
      id: workflow.id as string,
      name: workflow.name as string,
      status: workflow.status as string,
      runsToday: runsTodayByWorkflow.get(workflow.id as string) ?? 0,
    }));
  } catch {
    debugDashboardLog("H3", "lib/dashboard/stats.ts:listAutomationPreviews", "automation preview loader caught exception", {});
    return [];
  }
}

async function countAutomations(userId: string): Promise<number> {
  try {
    const db = getSupabaseAdmin();
    if (!db) return 0;

    const { count, error } = await db
      .from("workflows")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) {
      console.error("[dashboard] countAutomations failed:", error.message);
      debugDashboardLog("H3", "lib/dashboard/stats.ts:countAutomations", "workflows count query failed", {errorMessage:error.message});
      return 0;
    }
    debugDashboardLog("H3", "lib/dashboard/stats.ts:countAutomations", "workflows count query completed", {count:count ?? 0});
    return count ?? 0;
  } catch (error) {
    console.error("[dashboard] countAutomations exception:", error);
    debugDashboardLog("H3", "lib/dashboard/stats.ts:countAutomations", "workflows count query threw", {errorName:error instanceof Error?error.name:"unknown",errorMessage:error instanceof Error?error.message:String(error)});
    return 0;
  }
}

async function countActiveWorkflows(userId: string): Promise<number> {
  try {
    const db = getSupabaseAdmin();
    if (!db) return 0;

    const { count, error } = await db
      .from("workflows")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "active");

    if (error) {
      console.error("[dashboard] countActiveWorkflows failed:", error.message);
      debugDashboardLog("H3", "lib/dashboard/stats.ts:countActiveWorkflows", "active workflows count query failed", {errorMessage:error.message});
      return 0;
    }
    debugDashboardLog("H3", "lib/dashboard/stats.ts:countActiveWorkflows", "active workflows count query completed", {count:count ?? 0});
    return count ?? 0;
  } catch (error) {
    console.error("[dashboard] countActiveWorkflows exception:", error);
    debugDashboardLog("H3", "lib/dashboard/stats.ts:countActiveWorkflows", "active workflows count query threw", {errorName:error instanceof Error?error.name:"unknown",errorMessage:error instanceof Error?error.message:String(error)});
    return 0;
  }
}

async function getEmailCountFromAccounts(
  accounts: { lastSyncCount?: number | null }[]
): Promise<number> {
  if (accounts.length === 0) return 0;
  return accounts.reduce(
    (sum, account) => sum + (account.lastSyncCount ?? 0),
    0
  );
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  debugDashboardLog("H2,H3,H4", "lib/dashboard/stats.ts:getDashboardData", "dashboard data loader entered", {hasUserId:Boolean(userId)});
  try {
    const [
      gmailAccounts,
      automations,
      activeWorkflows,
      meetings,
      crmContacts,
      todaysMeetings,
      automationPreviews,
      topContacts,
    ] = await Promise.all([
      gmailAccountRepository.listAccounts(userId).catch(() => [] as Awaited<ReturnType<typeof gmailAccountRepository.listAccounts>>),
      countAutomations(userId),
      countActiveWorkflows(userId),
      countMeetings(userId),
      countContacts(userId),
      listTodaysMeetings(userId),
      listAutomationPreviews(userId),
      listTopContacts(userId),
    ]);

    const emailCount = await getEmailCountFromAccounts(gmailAccounts);

    return {
      stats: {
        emailCount,
        connectedGmailAccounts: gmailAccounts.length,
        automations,
        activeWorkflows,
        meetings,
        crmContacts,
      },
      todaysMeetings,
      automations: automationPreviews,
      topContacts,
    };
  } catch (error) {
    console.error("[dashboard] Failed to load stats:", error);
    debugDashboardLog("H2,H3,H4", "lib/dashboard/stats.ts:getDashboardData", "dashboard data loader caught exception", {errorName:error instanceof Error?error.name:"unknown",errorMessage:error instanceof Error?error.message:String(error)});
    return EMPTY_DASHBOARD_DATA;
  }
}
