import type { AnalyticsSnapshot } from "./types";
import { formatKpiCurrency, formatHours, formatPercent } from "./format";
import { healthRatingLabel } from "./format";

function csvEscape(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function row(cells: (string | number)[]): string {
  return cells.map(csvEscape).join(",");
}

export function snapshotToCsv(snapshot: AnalyticsSnapshot): string {
  const lines: string[] = [];
  const { overview, email, crm, calendar, tasks, automations, roxx, productivity } =
    snapshot;

  lines.push("Actora Analytics Report");
  lines.push(`Period,${snapshot.period}`);
  lines.push(`Generated,${snapshot.generatedAt}`);
  lines.push("");

  lines.push("Overview");
  lines.push(row(["Metric", "Value"]));
  lines.push(row(["Emails Processed", overview.emailsProcessed]));
  lines.push(row(["AI Replies Generated", overview.aiRepliesGenerated]));
  lines.push(row(["Emails Saved by AI", overview.emailsSavedByAi]));
  lines.push(row(["Contacts", overview.contacts]));
  lines.push(row(["Companies", overview.companies]));
  lines.push(row(["Deals", overview.deals]));
  lines.push(row(["Meetings", overview.meetings]));
  lines.push(row(["Tasks", overview.tasks]));
  lines.push(row(["Active Automations", overview.activeAutomations]));
  lines.push(row(["Roxx AI Conversations", overview.roxxConversations]));
  lines.push(row(["AI Time Saved (hours)", overview.aiTimeSavedHours]));
  lines.push(
    row([
      "Workspace Health Score",
      `${overview.workspaceHealthScore} (${healthRatingLabel(overview.healthRating)})`,
    ])
  );
  lines.push("");

  lines.push("Email Analytics");
  lines.push(row(["Avg Response Time", formatHours(email.avgResponseTimeHours)]));
  lines.push(row(["Inbox Zero Progress", formatPercent(email.inboxZeroProgress)]));
  lines.push(row(["Priority Email %", formatPercent(email.priorityEmailPercent)]));
  lines.push("");

  lines.push("CRM Analytics");
  lines.push(row(["Pipeline Value", formatKpiCurrency(crm.pipelineValue)]));
  lines.push(row(["Deals Won", crm.dealsWon]));
  lines.push(row(["Deals Lost", crm.dealsLost]));
  lines.push(row(["Conversion Rate", formatPercent(crm.conversionRate)]));
  lines.push(row(["Win Rate", formatPercent(crm.winRate)]));
  lines.push(row(["Avg Deal Size", formatKpiCurrency(crm.avgDealSize)]));
  lines.push("");

  lines.push("Calendar Analytics");
  lines.push(row(["Meetings This Week", calendar.meetingsThisWeek]));
  lines.push(row(["Meetings This Month", calendar.meetingsThisMonth]));
  lines.push(row(["Hours in Meetings", calendar.hoursInMeetings]));
  lines.push(row(["Upcoming Meetings", calendar.upcomingMeetings]));
  lines.push(row(["Completion Rate", formatPercent(calendar.completionRate)]));
  lines.push("");

  lines.push("Task Analytics");
  lines.push(row(["Completed", tasks.completed]));
  lines.push(row(["Pending", tasks.pending]));
  lines.push(row(["Overdue", tasks.overdue]));
  lines.push("");

  lines.push("Automation Analytics");
  lines.push(row(["Executed", automations.executed]));
  lines.push(row(["Successful", automations.successful]));
  lines.push(row(["Failed", automations.failed]));
  lines.push(row(["Time Saved (hours)", automations.timeSavedHours]));
  lines.push("");

  lines.push("Roxx AI Analytics");
  lines.push(row(["Conversations", roxx.totalConversations]));
  lines.push(row(["Messages Sent", roxx.messagesSent]));
  lines.push(row(["Actions Completed", roxx.actionsCompleted]));
  lines.push(row(["Success Rate", formatPercent(roxx.successRate)]));
  lines.push("");

  lines.push("Productivity Breakdown");
  lines.push(row(["Inbox Zero", formatPercent(productivity.inboxZero)]));
  lines.push(row(["CRM Activity", formatPercent(productivity.crmActivity)]));
  lines.push(row(["Tasks Completed", formatPercent(productivity.tasksCompleted)]));
  lines.push(row(["Meetings Attended", formatPercent(productivity.meetingsAttended)]));
  lines.push(row(["Automation Usage", formatPercent(productivity.automationUsage)]));
  lines.push(row(["Roxx Usage", formatPercent(productivity.roxxUsage)]));

  return lines.join("\n");
}

export function downloadCsv(snapshot: AnalyticsSnapshot): void {
  const csv = snapshotToCsv(snapshot);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `actora-analytics-${snapshot.period}-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function printPdfReport(snapshot: AnalyticsSnapshot): void {
  const { overview } = snapshot;
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Actora Analytics</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 32px; color: #111; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .meta { color: #666; font-size: 13px; margin-bottom: 24px; }
  h2 { font-size: 15px; margin: 20px 0 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  td, th { text-align: left; padding: 6px 8px; border-bottom: 1px solid #f0f0f0; }
  th { color: #666; font-weight: 600; }
</style></head><body>
<h1>Actora Analytics Report</h1>
<p class="meta">Period: ${snapshot.period} · Generated ${new Date(snapshot.generatedAt).toLocaleString()}</p>
<h2>Overview</h2>
<table>
<tr><th>Metric</th><th>Value</th></tr>
<tr><td>Emails Processed</td><td>${overview.emailsProcessed}</td></tr>
<tr><td>AI Replies</td><td>${overview.aiRepliesGenerated}</td></tr>
<tr><td>Workspace Health</td><td>${overview.workspaceHealthScore} (${healthRatingLabel(overview.healthRating)})</td></tr>
<tr><td>Pipeline</td><td>${formatKpiCurrency(snapshot.crm.pipelineValue)}</td></tr>
<tr><td>AI Time Saved</td><td>${formatHours(overview.aiTimeSavedHours)}</td></tr>
</table>
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}
