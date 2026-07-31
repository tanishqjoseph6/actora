import "server-only";

import { buildWorkspaceContext } from "@/lib/assistant/context";
import { createUserNotification } from "@/lib/notifications/repository";

export type ProactiveInsight = {
  id: string;
  severity: "info" | "warning" | "urgent";
  title: string;
  body: string;
  href: string;
  actionPrompt: string;
};

/**
 * Generate proactive workspace insights for Roxx AI.
 */
export async function buildProactiveInsights(
  userId: string
): Promise<ProactiveInsight[]> {
  const ctx = await buildWorkspaceContext(userId);
  const insights: ProactiveInsight[] = [];
  const now = Date.now();

  const upcoming = ctx.meetings
    .filter((m) => {
      const t = new Date(m.startAt).getTime();
      return t > now && t < now + 24 * 60 * 60 * 1000;
    })
    .slice(0, 3);

  for (const m of upcoming) {
    insights.push({
      id: `meeting-${m.id}`,
      severity: "info",
      title: "Upcoming meeting",
      body: `${m.title} · ${new Date(m.startAt).toLocaleString()}`,
      href: "/dashboard/calendar",
      actionPrompt: `Prep me for the meeting “${m.title}” and list action items.`,
    });
  }

  const overdue = ctx.tasks.filter((t) => {
    const due = new Date(t.dueDate).getTime();
    return Number.isFinite(due) && due < now && t.status !== "done";
  });

  if (overdue.length) {
    insights.push({
      id: "overdue-tasks",
      severity: "urgent",
      title: `${overdue.length} overdue task${overdue.length === 1 ? "" : "s"}`,
      body: overdue
        .slice(0, 3)
        .map((t) => t.title)
        .join(" · "),
      href: "/dashboard/tasks",
      actionPrompt: "Show overdue tasks and help me prioritize what to finish today.",
    });
  }

  const stuck = ctx.deals.filter(
    (d) => d.stage === "negotiation" || d.stage === "proposal"
  );
  if (stuck.length) {
    insights.push({
      id: "stuck-deals",
      severity: "warning",
      title: "Deals that may need a nudge",
      body: stuck
        .slice(0, 3)
        .map((d) => `${d.title} (${d.companyName})`)
        .join(" · "),
      href: "/dashboard/crm/pipeline",
      actionPrompt:
        "Review stuck deals in proposal/negotiation and suggest follow-ups.",
    });
  }

  const highPriority = ctx.emails.filter(
    (e) =>
      e.unread &&
      (e.priority === "high" ||
        /urgent|asap|important|invoice|demo/i.test(`${e.subject} ${e.preview}`))
  );
  if (highPriority.length) {
    insights.push({
      id: "priority-email",
      severity: "warning",
      title: "High-priority unread email",
      body: highPriority
        .slice(0, 2)
        .map((e) => `${e.sender}: ${e.subject}`)
        .join(" · "),
      href: "/dashboard/inbox",
      actionPrompt: "Summarize my high-priority unread emails and draft replies.",
    });
  }

  const unread = ctx.emails.filter((e) => e.unread);
  if (unread.length >= 5) {
    insights.push({
      id: "missed-followups",
      severity: "info",
      title: "Possible missed follow-ups",
      body: `${unread.length} unread threads in your recent inbox sample.`,
      href: "/dashboard/inbox",
      actionPrompt:
        "Find conversations that likely need a follow-up and draft messages.",
    });
  }

  if (ctx.tasks.length >= 3 && ctx.meetings.length >= 2) {
    insights.push({
      id: "productivity",
      severity: "info",
      title: "Productivity insight",
      body: `You have ${ctx.tasks.length} open tasks and ${ctx.meetings.length} meetings this week — protect focus time.`,
      href: "/dashboard",
      actionPrompt:
        "Give me a productivity plan for today based on my tasks and meetings.",
    });
  }

  insights.push({
    id: "suggest-automation",
    severity: "info",
    title: "Suggested automation",
    body: "Auto-create CRM leads from inbound emails and notify you.",
    href: "/dashboard/automations",
    actionPrompt:
      "Create a draft automation that turns new emails into CRM leads and notifies me.",
  });

  return insights.slice(0, 8);
}

export async function notifyProactiveInsights(userId: string): Promise<number> {
  const insights = await buildProactiveInsights(userId);
  const urgent = insights.filter((i) => i.severity !== "info").slice(0, 3);
  for (const insight of urgent) {
    await createUserNotification(userId, {
      category: "Roxx AI",
      title: insight.title,
      body: insight.body,
      href: insight.href,
    });
  }
  return urgent.length;
}
