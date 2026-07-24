import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getDashboardData } from "@/lib/dashboard/stats";
import { listStoredCalendarEvents } from "@/lib/calendar/meetings-store";
import { fetchDealsEnriched, fetchCompaniesWithStats } from "@/lib/crm/repository";
import { automationRepository } from "@/lib/automations/repository";
import { getGmailClientForUser } from "@/lib/automations/integrations";
import { fetchInboxEmails } from "@/lib/gmail";
import { runGlobalSearch } from "@/lib/search/global-search";

export type WorkspaceContext = {
  summaryText: string;
  emails: {
    id: string;
    sender: string;
    subject: string;
    preview: string;
    unread: boolean;
    priority?: string;
  }[];
  deals: { id: string; title: string; stage: string; value: number; companyName: string }[];
  tasks: { id: string; title: string; status: string; dueDate: string; priority: string }[];
  meetings: { id: string; title: string; startAt: string; status: string }[];
};

type CacheEntry = { at: number; value: WorkspaceContext };

const CONTEXT_CACHE_TTL_MS = 45_000;
const contextCache = new Map<string, CacheEntry>();

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function buildWorkspaceContext(
  userId: string
): Promise<WorkspaceContext> {
  const cached = contextCache.get(userId);
  if (cached && Date.now() - cached.at < CONTEXT_CACHE_TTL_MS) {
    return cached.value;
  }

  const value = await buildWorkspaceContextFresh(userId);
  contextCache.set(userId, { at: Date.now(), value });
  return value;
}

async function buildWorkspaceContextFresh(
  userId: string
): Promise<WorkspaceContext> {
  const db = getSupabaseAdmin();
  const dashboard = await getDashboardData(userId);

  const [deals, companies, workflows, meetings, tasksResult, emails] =
    await Promise.all([
      fetchDealsEnriched(userId).catch(() => []),
      fetchCompaniesWithStats(userId).catch(() => []),
      automationRepository.listWorkflows(userId).catch(() => []),
      listStoredCalendarEvents(userId, {
        from: startOfToday().toISOString(),
        to: new Date(Date.now() + 7 * 24 * 60 * 60_000).toISOString(),
      }).catch(() => []),
      db
        ? db
            .from("tasks")
            .select("id, title, status, due_date, priority")
            .eq("user_id", userId)
            .neq("status", "done")
            .order("due_date", { ascending: true })
            .limit(15)
        : Promise.resolve({ data: [] }),
      loadRecentEmails(userId),
    ]);

  const tasks = ((tasksResult as { data?: unknown[] }).data ?? []).map(
    (row) => {
      const r = row as {
        id: string;
        title: string;
        status: string;
        due_date: string;
        priority: string;
      };
      return {
        id: r.id,
        title: r.title,
        status: r.status,
        dueDate: r.due_date,
        priority: r.priority,
      };
    }
  );

  const openStages = new Set(["lead", "qualified", "proposal", "negotiation"]);
  const openDeals = deals.filter((d) => openStages.has(d.stage));
  const pipelineValue = openDeals.reduce((s, d) => s + d.value, 0);
  const byStage = openDeals.reduce(
    (acc, d) => {
      acc[d.stage] = (acc[d.stage] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const unread = emails.filter((e) => e.unread);
  const activeWorkflows = workflows.filter((w) => w.status === "active");

  const lines: string[] = [
    `User workspace snapshot (${new Date().toLocaleString()}):`,
    `- Emails (synced count): ${dashboard.stats.emailCount}; Gmail accounts: ${dashboard.stats.connectedGmailAccounts}`,
    `- Unread in recent inbox sample: ${unread.length} of ${emails.length}`,
    `- CRM contacts: ${dashboard.stats.crmContacts}; companies: ${companies.length}`,
    `- Open deals: ${openDeals.length}; pipeline value: $${pipelineValue.toLocaleString()}`,
    `- Deal stages: ${JSON.stringify(byStage)}`,
    `- Open tasks: ${tasks.length}`,
    `- Meetings (next 7 days): ${meetings.length}; today: ${dashboard.todaysMeetings.length}`,
    `- Automations: ${workflows.length} total, ${activeWorkflows.length} active`,
  ];

  if (emails.length) {
    lines.push("\nRecent emails:");
    for (const e of emails.slice(0, 12)) {
      lines.push(
        `- [${e.unread ? "UNREAD" : "read"}] ${e.sender} · ${e.subject} — ${e.preview.slice(0, 120)}`
      );
    }
  }

  if (openDeals.length) {
    lines.push("\nOpen pipeline deals:");
    for (const d of openDeals.slice(0, 10)) {
      lines.push(
        `- ${d.title} · ${d.companyName} · ${d.stage} · $${d.value.toLocaleString()}`
      );
    }
  }

  if (tasks.length) {
    lines.push("\nOpen tasks:");
    for (const t of tasks.slice(0, 10)) {
      lines.push(
        `- ${t.title} · ${t.priority} · due ${new Date(t.dueDate).toLocaleDateString()} · ${t.status}`
      );
    }
  }

  if (meetings.length) {
    lines.push("\nUpcoming meetings:");
    for (const m of meetings.slice(0, 8)) {
      lines.push(
        `- ${m.title} · ${new Date(m.startAt).toLocaleString()} · ${m.status}`
      );
    }
  }

  if (activeWorkflows.length) {
    lines.push("\nActive automations:");
    for (const w of activeWorkflows.slice(0, 6)) {
      lines.push(`- ${w.name} (${w.triggerBlockId ?? "manual"})`);
    }
  }

  return {
    summaryText: lines.join("\n"),
    emails: emails.slice(0, 20),
    deals: openDeals.map((d) => ({
      id: d.id,
      title: d.title,
      stage: d.stage,
      value: d.value,
      companyName: d.companyName,
    })),
    tasks,
    meetings: meetings.map((m) => ({
      id: m.id,
      title: m.title,
      startAt: m.startAt,
      status: m.status,
    })),
  };
}

async function loadRecentEmails(userId: string) {
  try {
    const client = await getGmailClientForUser(userId);
    if (!client) return [];
    const emails = await fetchInboxEmails(client, { maxResults: 20 });
    return emails.map((e) => ({
      id: e.id,
      sender: e.sender,
      subject: e.subject,
      preview: e.preview,
      unread: e.unread,
      priority: e.priority,
    }));
  } catch {
    return [];
  }
}

export async function searchWorkspace(userId: string, query: string) {
  const results = await runGlobalSearch(userId, query);
  return results.slice(0, 12).map((r) => ({
    id: r.id,
    label: r.label,
    description: r.description,
    href: r.href,
    category: r.category,
  }));
}
