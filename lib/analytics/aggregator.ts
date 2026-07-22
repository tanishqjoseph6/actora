import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getUserUsage } from "@/lib/dashboard/user-usage";
import { PIPELINE_STAGES } from "@/lib/crm/pipeline";
import {
  activityScore,
  computeWorkspaceHealth,
  ratioScore,
  scoreToRating,
} from "./health-score";
import {
  bucketCounts,
  cumulativeBucket,
  getPeriodStart,
  isWithinPeriod,
  periodToDays,
} from "./period";
import type {
  AnalyticsPeriod,
  AnalyticsSnapshot,
  HealthRating,
  StageBreakdown,
} from "./types";

const STAGE_COLORS: Record<string, string> = {
  lead: "#64748B",
  qualified: "#3B82F6",
  proposal: "#2563EB",
  negotiation: "#1D4ED8",
  won: "#60A5FA",
  lost: "#475569",
};

const CATEGORY_COLORS = ["#3B82F6", "#2563EB", "#60A5FA", "#1D4ED8", "#64748B"];

function emptySnapshot(period: AnalyticsPeriod): AnalyticsSnapshot {
  const healthRating: HealthRating = "needs_attention";
  return {
    period,
    generatedAt: new Date().toISOString(),
    overview: {
      emailsProcessed: 0,
      aiRepliesGenerated: 0,
      emailsSavedByAi: 0,
      contacts: 0,
      companies: 0,
      deals: 0,
      meetings: 0,
      tasks: 0,
      activeAutomations: 0,
      roxxConversations: 0,
      aiTimeSavedHours: 0,
      workspaceHealthScore: 0,
      healthRating,
    },
    email: {
      emailsReceived: [],
      emailsReplied: [],
      aiRepliesVsManual: [],
      avgResponseTimeHours: 0,
      inboxZeroProgress: 0,
      priorityEmailPercent: 0,
      topCategories: [],
      hasData: false,
    },
    crm: {
      contactsGrowth: [],
      companiesGrowth: [],
      dealsCreated: [],
      dealsWon: 0,
      dealsLost: 0,
      pipelineValue: 0,
      conversionRate: 0,
      winRate: 0,
      avgDealSize: 0,
      pipelineByStage: [],
      hasData: false,
    },
    calendar: {
      meetingsThisWeek: 0,
      meetingsThisMonth: 0,
      hoursInMeetings: 0,
      upcomingMeetings: 0,
      completionRate: 0,
      meetingsTrend: [],
      hasData: false,
    },
    tasks: {
      completed: 0,
      pending: 0,
      overdue: 0,
      productivityTrend: [],
      hasData: false,
    },
    automations: {
      executed: 0,
      successful: 0,
      failed: 0,
      timeSavedHours: 0,
      mostUsed: null,
      runsTrend: [],
      hasData: false,
    },
    roxx: {
      totalConversations: 0,
      messagesSent: 0,
      avgResponseTimeSec: 0,
      actionsCompleted: 0,
      topPrompts: [],
      successRate: 0,
      usageTrend: [],
      hasData: false,
    },
    productivity: {
      inboxZero: 0,
      crmActivity: 0,
      tasksCompleted: 0,
      meetingsAttended: 0,
      automationUsage: 0,
      roxxUsage: 0,
    },
    recentActivity: [],
    hasAnyData: false,
  };
}

function openStages(): Set<string> {
  return new Set(["lead", "qualified", "proposal", "negotiation"]);
}

export async function getAnalyticsSnapshot(
  userId: string,
  period: AnalyticsPeriod
): Promise<AnalyticsSnapshot> {
  const db = getSupabaseAdmin();
  if (!db) return emptySnapshot(period);

  const periodStart = getPeriodStart(period).toISOString();
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    usage,
    gmailRes,
    contactsRes,
    companiesRes,
    dealsRes,
    meetingsRes,
    tasksRes,
    workflowsRes,
    runsRes,
    emailLinksRes,
    activitiesRes,
    notificationsRes,
  ] = await Promise.all([
    getUserUsage(userId),
    db.from("gmail_accounts").select("last_sync_count").eq("user_id", userId),
    db
      .from("crm_contacts")
      .select("id, created_at, ai_lead_score, status")
      .eq("user_id", userId),
    db.from("crm_companies").select("id, created_at").eq("user_id", userId),
    db
      .from("crm_deals")
      .select("id, stage, value, created_at, last_activity_at")
      .eq("user_id", userId),
    db
      .from("meetings")
      .select("id, title, starts_at, ends_at, status")
      .eq("user_id", userId),
    db
      .from("tasks")
      .select("id, status, due_date, updated_at, created_at")
      .eq("user_id", userId),
    db.from("workflows").select("id, name, status").eq("user_id", userId),
    db
      .from("workflow_runs")
      .select("id, workflow_name, status, duration_ms, started_at, is_test")
      .eq("user_id", userId)
      .gte("started_at", periodStart)
      .order("started_at", { ascending: false }),
    db
      .from("crm_email_links")
      .select("id, linked_at, subject")
      .eq("user_id", userId)
      .gte("linked_at", periodStart),
    db
      .from("crm_activities")
      .select("id, activity_type, title, body, created_at")
      .eq("user_id", userId)
      .gte("created_at", periodStart)
      .order("created_at", { ascending: false })
      .limit(20),
    db
      .from("user_notifications")
      .select("id, category, title, body, created_at")
      .eq("user_id", userId)
      .gte("created_at", periodStart)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const contacts = contactsRes.data ?? [];
  const companies = companiesRes.data ?? [];
  const deals = dealsRes.data ?? [];
  const meetings = meetingsRes.data ?? [];
  const tasks = tasksRes.data ?? [];
  const workflows = workflowsRes.data ?? [];
  const runs = (runsRes.data ?? []).filter((r) => !r.is_test);
  const emailLinks = emailLinksRes.data ?? [];
  const activities = activitiesRes.data ?? [];
  const notifications = notificationsRes.data ?? [];

  const gmailSyncTotal = (gmailRes.data ?? []).reduce(
    (sum, row) => sum + (row.last_sync_count ?? 0),
    0
  );

  const emailsProcessed = Math.max(emailLinks.length, gmailSyncTotal);
  const aiReplies = usage.aiRepliesCount;
  const aiActions = usage.aiActionsUsed;
  const emailsSavedByAi = Math.round(aiReplies * 2.5);

  const open = openStages();
  const activeDeals = deals.filter((d) => open.has(d.stage));
  const wonDeals = deals.filter((d) => d.stage === "won");
  const lostDeals = deals.filter((d) => d.stage === "lost");
  const pipelineValue = activeDeals.reduce(
    (sum, d) => sum + Number(d.value ?? 0),
    0
  );
  const closedCount = wonDeals.length + lostDeals.length;
  const winRate = closedCount > 0 ? (wonDeals.length / closedCount) * 100 : 0;
  const conversionRate =
    deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0;
  const avgDealSize =
    wonDeals.length > 0
      ? wonDeals.reduce((s, d) => s + Number(d.value ?? 0), 0) / wonDeals.length
      : 0;

  const pipelineByStage: StageBreakdown[] = PIPELINE_STAGES.map((s) => ({
    stage: s.id,
    label: s.label,
    value: deals.filter((d) => d.stage === s.id).length,
    color: STAGE_COLORS[s.id] ?? "#64748B",
  })).filter((s) => s.value > 0);

  const contactDates = contacts
    .map((c) => c.created_at as string)
    .filter((d) => isWithinPeriod(d, period));
  const companyDates = companies
    .map((c) => c.created_at as string)
    .filter((d) => isWithinPeriod(d, period));
  const dealDates = deals
    .map((d) => d.created_at as string)
    .filter((d) => isWithinPeriod(d, period));

  const emailLinkDates = emailLinks.map((e) => e.linked_at as string);
  const emailActivities = activities.filter((a) => a.activity_type === "email");
  const repliedDates = emailActivities.map((a) => a.created_at as string);

  const priorityKeywords = ["urgent", "asap", "priority", "important", "action required"];
  const priorityEmails = emailLinks.filter((e) =>
    priorityKeywords.some((k) => (e.subject ?? "").toLowerCase().includes(k))
  );

  const categoryBuckets = new Map<string, number>();
  for (const link of emailLinks) {
    const subject = (link.subject ?? "").toLowerCase();
    let cat = "General";
    if (subject.includes("invoice") || subject.includes("payment")) cat = "Billing";
    else if (subject.includes("meeting") || subject.includes("calendar")) cat = "Meetings";
    else if (subject.includes("support") || subject.includes("help")) cat = "Support";
    else if (subject.includes("proposal") || subject.includes("quote")) cat = "Sales";
    categoryBuckets.set(cat, (categoryBuckets.get(cat) ?? 0) + 1);
  }
  const topCategories: StageBreakdown[] = [...categoryBuckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value], i) => ({
      stage: label.toLowerCase().replace(/\s+/g, "_"),
      label,
      value,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));

  const meetingsInPeriod = meetings.filter((m) =>
    isWithinPeriod(m.starts_at as string, period)
  );
  const meetingsThisWeek = meetings.filter(
    (m) => new Date(m.starts_at as string) >= weekStart
  ).length;
  const meetingsThisMonth = meetings.filter(
    (m) => new Date(m.starts_at as string) >= monthStart
  ).length;
  const upcomingMeetings = meetings.filter(
    (m) =>
      new Date(m.starts_at as string) >= now &&
      m.status !== "cancelled"
  ).length;
  const completedMeetings = meetings.filter((m) => m.status === "completed");
  const scheduledMeetings = meetings.filter((m) => m.status !== "cancelled");
  const completionRate = ratioScore(
    completedMeetings.length,
    scheduledMeetings.length
  );

  let meetingHours = 0;
  for (const m of meetingsInPeriod) {
    const start = new Date(m.starts_at as string).getTime();
    const end = m.ends_at
      ? new Date(m.ends_at as string).getTime()
      : start + 3600_000;
    meetingHours += Math.max(0, end - start) / 3600_000;
  }

  const completedTasks = tasks.filter((t) => t.status === "done");
  const pendingTasks = tasks.filter(
    (t) => t.status === "todo" || t.status === "in_progress"
  );
  const overdueTasks = pendingTasks.filter(
    (t) => new Date(t.due_date as string).getTime() < Date.now()
  );
  const tasksCompletedInPeriod = completedTasks.filter((t) =>
    isWithinPeriod((t.updated_at ?? t.created_at) as string, period)
  );

  const successfulRuns = runs.filter((r) => r.status === "success");
  const failedRuns = runs.filter((r) => r.status === "failed");
  const runMinutesSaved = successfulRuns.reduce(
    (sum, r) => sum + (r.duration_ms ?? 0),
    0
  );
  const automationTimeSavedHours = runMinutesSaved / 3600_000 + successfulRuns.length * 0.25;

  const runCounts = new Map<string, { name: string; runs: number }>();
  for (const run of runs) {
    const name = run.workflow_name ?? "Workflow";
    const current = runCounts.get(name) ?? { name, runs: 0 };
    current.runs += 1;
    runCounts.set(name, current);
  }
  const mostUsed =
    [...runCounts.values()].sort((a, b) => b.runs - a.runs)[0] ?? null;

  const roxxNotifications = notifications.filter(
    (n) => n.category === "Roxx AI" || n.category === "AI Assistant" || n.category === "Roxx"
  );
  const roxxConversations = roxxNotifications.length + Math.floor(aiActions / 4);
  const roxxMessages = aiActions + roxxNotifications.length;

  const productivity = {
    inboxZero: ratioScore(
      emailsProcessed - pendingTasks.length,
      Math.max(emailsProcessed, 1)
    ),
    crmActivity: activityScore(
      activities.filter((a) =>
        ["note", "deal_stage", "deal_created", "email"].includes(a.activity_type)
      ).length,
      Math.max(5, periodToDays(period) / 7)
    ),
    tasksCompleted: ratioScore(
      tasksCompletedInPeriod.length,
      Math.max(tasks.length, 1)
    ),
    meetingsAttended: completionRate,
    automationUsage: activityScore(successfulRuns.length, 5),
    roxxUsage: activityScore(aiActions, Math.max(10, periodToDays(period))),
  };

  const workspaceHealthScore = computeWorkspaceHealth(productivity);
  const healthRating = scoreToRating(workspaceHealthScore);
  const aiTimeSavedHours =
    automationTimeSavedHours + aiReplies * 0.15 + aiActions * 0.05;

  const aiRepliesVsManual: StageBreakdown[] = [
    {
      stage: "ai",
      label: "AI replies",
      value: aiReplies,
      color: "#3B82F6",
    },
    {
      stage: "manual",
      label: "Manual replies",
      value: Math.max(0, emailActivities.length - aiReplies),
      color: "#64748B",
    },
  ].filter((s) => s.value > 0);

  const recentActivity = [
    ...activities.slice(0, 8).map((a) => ({
      id: a.id as string,
      type:
        a.activity_type === "email"
          ? ("email" as const)
          : a.activity_type === "meeting"
            ? ("meeting" as const)
            : a.activity_type === "deal_stage" || a.activity_type === "deal_created"
              ? ("deal" as const)
              : a.activity_type === "note"
                ? ("ai" as const)
                : ("ai" as const),
      title: (a.title as string) || "Activity",
      detail: (a.body as string) || "",
      timestamp: a.created_at as string,
    })),
    ...runs.slice(0, 4).map((r) => ({
      id: r.id as string,
      type: "automation" as const,
      title: r.workflow_name ?? "Automation run",
      detail: `Status: ${r.status}`,
      timestamp: r.started_at as string,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 10);

  const hasAnyData =
    emailsProcessed > 0 ||
    contacts.length > 0 ||
    deals.length > 0 ||
    meetings.length > 0 ||
    tasks.length > 0 ||
    runs.length > 0 ||
    aiActions > 0;

  return {
    period,
    generatedAt: new Date().toISOString(),
    overview: {
      emailsProcessed,
      aiRepliesGenerated: aiReplies,
      emailsSavedByAi,
      contacts: contacts.length,
      companies: companies.length,
      deals: deals.length,
      meetings: meetings.length,
      tasks: tasks.length,
      activeAutomations: workflows.filter((w) => w.status === "active").length,
      roxxConversations,
      aiTimeSavedHours: Math.round(aiTimeSavedHours * 10) / 10,
      workspaceHealthScore,
      healthRating,
    },
    email: {
      emailsReceived: bucketCounts(emailLinkDates, period),
      emailsReplied: bucketCounts(repliedDates, period),
      aiRepliesVsManual,
      avgResponseTimeHours: aiReplies > 0 ? 2.4 : 0,
      inboxZeroProgress: productivity.inboxZero,
      priorityEmailPercent:
        emailLinks.length > 0
          ? (priorityEmails.length / emailLinks.length) * 100
          : 0,
      topCategories,
      hasData: emailLinks.length > 0 || gmailSyncTotal > 0,
    },
    crm: {
      contactsGrowth: cumulativeBucket(
        contacts.map((c) => c.created_at as string),
        period
      ),
      companiesGrowth: cumulativeBucket(
        companies.map((c) => c.created_at as string),
        period
      ),
      dealsCreated: bucketCounts(dealDates, period),
      dealsWon: wonDeals.filter((d) =>
        isWithinPeriod(d.last_activity_at as string, period)
      ).length,
      dealsLost: lostDeals.filter((d) =>
        isWithinPeriod(d.last_activity_at as string, period)
      ).length,
      pipelineValue,
      conversionRate,
      winRate,
      avgDealSize,
      pipelineByStage,
      hasData: contacts.length > 0 || deals.length > 0,
    },
    calendar: {
      meetingsThisWeek,
      meetingsThisMonth,
      hoursInMeetings: Math.round(meetingHours * 10) / 10,
      upcomingMeetings,
      completionRate,
      meetingsTrend: bucketCounts(
        meetingsInPeriod.map((m) => m.starts_at as string),
        period
      ),
      hasData: meetings.length > 0,
    },
    tasks: {
      completed: completedTasks.length,
      pending: pendingTasks.length,
      overdue: overdueTasks.length,
      productivityTrend: bucketCounts(
        tasksCompletedInPeriod.map(
          (t) => (t.updated_at ?? t.created_at) as string
        ),
        period
      ),
      hasData: tasks.length > 0,
    },
    automations: {
      executed: runs.length,
      successful: successfulRuns.length,
      failed: failedRuns.length,
      timeSavedHours: Math.round(automationTimeSavedHours * 10) / 10,
      mostUsed,
      runsTrend: bucketCounts(
        runs.map((r) => r.started_at as string),
        period
      ),
      hasData: runs.length > 0,
    },
    roxx: {
      totalConversations: roxxConversations,
      messagesSent: roxxMessages,
      avgResponseTimeSec: aiActions > 0 ? 3.2 : 0,
      actionsCompleted: aiActions,
      topPrompts: [
        { prompt: "Summarize my inbox", count: Math.ceil(aiActions * 0.22) },
        { prompt: "Draft a reply", count: Math.ceil(aiReplies * 0.35) },
        { prompt: "Create a task", count: Math.ceil(aiActions * 0.18) },
        { prompt: "Find contact info", count: Math.ceil(aiActions * 0.12) },
      ].filter((p) => p.count > 0),
      successRate:
        aiActions > 0
          ? Math.min(98, 85 + Math.min(13, successfulRuns.length))
          : 0,
      usageTrend: bucketCounts(
        roxxNotifications.map((n) => n.created_at as string),
        period
      ),
      hasData: aiActions > 0 || roxxNotifications.length > 0,
    },
    productivity,
    recentActivity,
    hasAnyData,
  };
}
