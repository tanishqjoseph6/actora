import { automationRepository } from "@/lib/automations/repository";
import { MOCK_CONTACTS } from "@/lib/crm/mock-data";
import { gmailAccountRepository } from "@/lib/gmail/repository";
import { MOCK_MEETINGS } from "@/lib/meetings/mock-data";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { ensureDashboardSeed } from "./ensure-seed";
import {
  EMPTY_DASHBOARD_DATA,
  type DashboardAutomationPreview,
  type DashboardContactPreview,
  type DashboardData,
  type DashboardMeetingPreview,
} from "./types";
import { getUserUsage } from "./user-usage";

const memoryContacts = new Map<string, number>();
const memoryMeetings = new Map<string, number>();

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

function seedMemoryCounts(userId: string): void {
  if (!memoryContacts.has(userId)) {
    memoryContacts.set(userId, MOCK_CONTACTS.length);
  }
  if (!memoryMeetings.has(userId)) {
    memoryMeetings.set(
      userId,
      MOCK_MEETINGS.filter((m) => m.status !== "cancelled").length
    );
  }
}

async function countContacts(userId: string): Promise<number> {
  const db = getSupabaseAdmin();
  if (!db) {
    seedMemoryCounts(userId);
    return memoryContacts.get(userId) ?? 0;
  }

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
  if (!db) {
    seedMemoryCounts(userId);
    return memoryMeetings.get(userId) ?? 0;
  }

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
  if (!db) {
    const todayStart = startOfToday();
    const todayEnd = endOfToday();
    return MOCK_MEETINGS.filter((meeting) => {
      if (meeting.status === "cancelled") return false;
      const start = new Date(meeting.startAt);
      return start >= todayStart && start <= todayEnd;
    }).map((meeting) => ({
      id: meeting.id,
      title: meeting.title,
      startsAt: meeting.startAt,
      status: meeting.status,
    }));
  }

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
  if (!db) {
    return MOCK_CONTACTS.slice()
      .sort((a, b) => b.aiLeadScore - a.aiLeadScore)
      .slice(0, 4)
      .map((contact) => ({
        id: contact.id,
        name: contact.name,
        companyName: contact.companyName,
        aiLeadScore: contact.aiLeadScore,
        status: contact.status,
      }));
  }

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
  try {
    const [workflows, runs] = await Promise.all([
      automationRepository.listWorkflows(userId),
      automationRepository.listRuns(userId),
    ]);

    const todayStart = startOfToday();
    const runsTodayByWorkflow = new Map<string, number>();

    for (const run of runs) {
      if (new Date(run.startedAt) < todayStart) continue;
      runsTodayByWorkflow.set(
        run.workflowId,
        (runsTodayByWorkflow.get(run.workflowId) ?? 0) + 1
      );
    }

    return workflows.slice(0, 5).map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      status: workflow.status,
      runsToday: runsTodayByWorkflow.get(workflow.id) ?? 0,
    }));
  } catch {
    return [];
  }
}

async function countAutomations(userId: string): Promise<number> {
  try {
    const workflows = await automationRepository.listWorkflows(userId);
    return workflows.length;
  } catch {
    return 0;
  }
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
    if (getSupabaseAdmin()) {
      await ensureDashboardSeed(userId);
    } else {
      seedMemoryCounts(userId);
    }

    const [
      usage,
      gmailAccounts,
      emailCount,
      automations,
      meetings,
      crmContacts,
      todaysMeetings,
      automationPreviews,
      topContacts,
    ] = await Promise.all([
      getUserUsage(userId),
      gmailAccountRepository.listAccounts(userId),
      getEmailCount(userId),
      countAutomations(userId),
      countMeetings(userId),
      countContacts(userId),
      listTodaysMeetings(userId),
      listAutomationPreviews(userId),
      listTopContacts(userId),
    ]);

    return {
      stats: {
        emailCount,
        aiReplies: usage.aiRepliesCount,
        aiActionsUsed: usage.aiActionsUsed,
        connectedGmailAccounts: gmailAccounts.length,
        automations,
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
