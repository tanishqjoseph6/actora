import { gmailAccountRepository } from "@/lib/gmail/repository";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  EMPTY_DASHBOARD_DATA,
  type DashboardAutomationPreview,
  type DashboardContactPreview,
  type DashboardData,
  type DashboardMeetingPreview,
} from "./types";

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
  const db = getSupabaseAdmin();
  if (!db) return 0;

  const { count, error } = await db
    .from("crm_contacts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    if (error.message.toLowerCase().includes("crm_contacts")) return 0;
    throw new Error(error.message);
  }

  return count ?? 0;
}

async function countMeetings(userId: string): Promise<number> {
  const db = getSupabaseAdmin();
  if (!db) return 0;

  const { count, error } = await db
    .from("meetings")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .neq("status", "cancelled");

  if (error) {
    if (error.message.toLowerCase().includes("meetings")) return 0;
    throw new Error(error.message);
  }

  return count ?? 0;
}

async function listTodaysMeetings(
  userId: string
): Promise<DashboardMeetingPreview[]> {
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
    if (error.message.toLowerCase().includes("meetings")) return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    startsAt: row.starts_at as string,
    status: row.status as string,
  }));
}

async function listTopContacts(
  userId: string
): Promise<DashboardContactPreview[]> {
  const db = getSupabaseAdmin();
  if (!db) return [];

  const { data, error } = await db
    .from("crm_contacts")
    .select("id, name, company_name, ai_lead_score, status")
    .eq("user_id", userId)
    .order("ai_lead_score", { ascending: false })
    .limit(4);

  if (error) {
    if (error.message.toLowerCase().includes("crm_contacts")) return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    companyName: (row.company_name as string | null) ?? null,
    aiLeadScore: (row.ai_lead_score as number) ?? 0,
    status: row.status as string,
  }));
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
      if (workflowError.message.toLowerCase().includes("workflows")) return [];
      throw new Error(workflowError.message);
    }

    const workflowIds = (workflows ?? []).map((w) => w.id as string);
    if (workflowIds.length === 0) return [];

    const { data: runs, error: runsError } = await db
      .from("workflow_runs")
      .select("workflow_id, started_at")
      .eq("user_id", userId)
      .in("workflow_id", workflowIds)
      .gte("started_at", startOfToday().toISOString());

    if (runsError && !runsError.message.toLowerCase().includes("workflow_runs")) {
      throw new Error(runsError.message);
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
    return [];
  }
}

async function countAutomations(userId: string): Promise<number> {
  const db = getSupabaseAdmin();
  if (!db) return 0;

  const { count, error } = await db
    .from("workflows")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    if (error.message.toLowerCase().includes("workflows")) return 0;
    throw new Error(error.message);
  }
  return count ?? 0;
}

async function countActiveWorkflows(userId: string): Promise<number> {
  const db = getSupabaseAdmin();
  if (!db) return 0;

  const { count, error } = await db
    .from("workflows")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    if (error.message.toLowerCase().includes("workflows")) return 0;
    throw new Error(error.message);
  }
  return count ?? 0;
}

async function getEmailCount(userId: string): Promise<number> {
  const accounts = await gmailAccountRepository.listAccounts(userId);
  if (accounts.length === 0) return 0;

  return accounts.reduce(
    (sum, account) => sum + (account.lastSyncCount ?? 0),
    0
  );
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  try {
    const [
      gmailAccounts,
      emailCount,
      automations,
      activeWorkflows,
      meetings,
      crmContacts,
      todaysMeetings,
      automationPreviews,
      topContacts,
    ] = await Promise.all([
      gmailAccountRepository.listAccounts(userId),
      getEmailCount(userId),
      countAutomations(userId),
      countActiveWorkflows(userId),
      countMeetings(userId),
      countContacts(userId),
      listTodaysMeetings(userId),
      listAutomationPreviews(userId),
      listTopContacts(userId),
    ]);

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
    return EMPTY_DASHBOARD_DATA;
  }
}
