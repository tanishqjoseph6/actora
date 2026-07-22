"use client";

import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import {
  formatHours,
  formatKpiCurrency,
  formatPercent,
} from "@/lib/analytics/format";
import type { AnalyticsSnapshot } from "@/lib/analytics/types";
import { AnalyticsSectionEmpty } from "./AnalyticsSectionEmpty";

type StatPillProps = { label: string; value: string | number };

function StatPill({ label, value }: StatPillProps) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0A0A0A]/50 px-3 py-2.5">
      <p className={`text-[10px] uppercase tracking-wider ${dashboard.subtle}`}>
        {label}
      </p>
      <p className="text-sm font-semibold text-white tabular-nums mt-0.5">
        {value}
      </p>
    </div>
  );
}

function SectionHeading({
  emoji,
  title,
  subtitle,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
        <span aria-hidden>{emoji}</span>
        {title}
      </h2>
      {subtitle && (
        <p className={`text-sm ${dashboard.muted} mt-1`}>{subtitle}</p>
      )}
    </div>
  );
}

type ChartSlotProps = {
  hasData: boolean;
  empty: React.ReactNode;
  children: React.ReactNode;
};

function ChartSlot({ hasData, empty, children }: ChartSlotProps) {
  if (!hasData) return <>{empty}</>;
  return <>{children}</>;
}

type AnalyticsDomainSectionsProps = {
  snapshot: AnalyticsSnapshot;
  charts: {
    EmailReceivedChart: React.ComponentType<{
      data: AnalyticsSnapshot["email"]["emailsReceived"];
    }>;
    EmailRepliedChart: React.ComponentType<{
      data: AnalyticsSnapshot["email"]["emailsReplied"];
    }>;
    AiVsManualChart: React.ComponentType<{
      data: AnalyticsSnapshot["email"]["aiRepliesVsManual"];
    }>;
    EmailCategoriesChart: React.ComponentType<{
      data: AnalyticsSnapshot["email"]["topCategories"];
    }>;
    ContactsGrowthChart: React.ComponentType<{
      data: AnalyticsSnapshot["crm"]["contactsGrowth"];
    }>;
    DealsCreatedChart: React.ComponentType<{
      data: AnalyticsSnapshot["crm"]["dealsCreated"];
    }>;
    PipelineStageChart: React.ComponentType<{
      data: AnalyticsSnapshot["crm"]["pipelineByStage"];
    }>;
    MeetingsTrendChart: React.ComponentType<{
      data: AnalyticsSnapshot["calendar"]["meetingsTrend"];
    }>;
    TasksTrendChart: React.ComponentType<{
      data: AnalyticsSnapshot["tasks"]["productivityTrend"];
    }>;
    AutomationRunsChart: React.ComponentType<{
      data: AnalyticsSnapshot["automations"]["runsTrend"];
    }>;
    RoxxUsageChart: React.ComponentType<{
      data: AnalyticsSnapshot["roxx"]["usageTrend"];
    }>;
  };
};

export function AnalyticsDomainSections({
  snapshot,
  charts,
}: AnalyticsDomainSectionsProps) {
  const { email, crm, calendar, tasks, automations, roxx } = snapshot;
  const {
    EmailReceivedChart,
    EmailRepliedChart,
    AiVsManualChart,
    EmailCategoriesChart,
    ContactsGrowthChart,
    DealsCreatedChart,
    PipelineStageChart,
    MeetingsTrendChart,
    TasksTrendChart,
    AutomationRunsChart,
    RoxxUsageChart,
  } = charts;

  return (
    <>
      {/* Email */}
      <section className="mb-8 lg:mb-10">
        <SectionHeading
          emoji="✉️"
          title="Email Analytics"
          subtitle="Inbox volume, replies, and AI performance"
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
          <StatPill
            label="Avg response"
            value={formatHours(email.avgResponseTimeHours)}
          />
          <StatPill
            label="Inbox Zero"
            value={formatPercent(email.inboxZeroProgress)}
          />
          <StatPill
            label="Priority emails"
            value={formatPercent(email.priorityEmailPercent)}
          />
          <StatPill
            label="AI replies"
            value={snapshot.overview.aiRepliesGenerated}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <ChartSlot
            hasData={email.hasData}
            empty={
              <AnalyticsSectionEmpty
                illustration="inbox"
                title="No email data yet"
                description="Connect your inbox and process emails to see volume trends and AI reply insights."
                ctaLabel="Open AI Inbox"
                ctaHref="/dashboard/inbox"
              />
            }
          >
            <EmailReceivedChart data={email.emailsReceived} />
          </ChartSlot>
          <ChartSlot
            hasData={email.hasData}
            empty={
              <AnalyticsSectionEmpty
                illustration="inbox"
                title="Reply trends appear here"
                description="Send replies from Actora to track manual vs AI response patterns."
                ctaLabel="Go to Inbox"
                ctaHref="/dashboard/inbox"
              />
            }
          >
            <EmailRepliedChart data={email.emailsReplied} />
          </ChartSlot>
          <ChartSlot
            hasData={email.aiRepliesVsManual.length > 0}
            empty={
              <AnalyticsSectionEmpty
                illustration="inbox"
                title="AI vs manual replies"
                description="Use AI reply suggestions to compare automation against manual responses."
                ctaLabel="Try AI Reply"
                ctaHref="/dashboard/inbox"
              />
            }
          >
            <AiVsManualChart data={email.aiRepliesVsManual} />
          </ChartSlot>
          <ChartSlot
            hasData={email.topCategories.length > 0}
            empty={
              <AnalyticsSectionEmpty
                illustration="inbox"
                title="Email categories"
                description="Categories are inferred from linked inbox messages over time."
                ctaLabel="Connect Gmail"
                ctaHref="/dashboard/inbox"
              />
            }
          >
            <EmailCategoriesChart data={email.topCategories} />
          </ChartSlot>
        </div>
      </section>

      {/* CRM */}
      <section className="mb-8 lg:mb-10">
        <SectionHeading
          emoji="💼"
          title="CRM Analytics"
          subtitle="Pipeline growth, conversions, and deal performance"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4">
          <StatPill label="Pipeline" value={formatKpiCurrency(crm.pipelineValue)} />
          <StatPill label="Deals won" value={crm.dealsWon} />
          <StatPill label="Deals lost" value={crm.dealsLost} />
          <StatPill label="Conversion" value={formatPercent(crm.conversionRate)} />
          <StatPill label="Win rate" value={formatPercent(crm.winRate)} />
          <StatPill label="Avg deal" value={formatKpiCurrency(crm.avgDealSize)} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <ChartSlot
            hasData={crm.hasData}
            empty={
              <AnalyticsSectionEmpty
                illustration="crm"
                title="Build your CRM pipeline"
                description="Add contacts and deals to track growth and conversion metrics."
                ctaLabel="Add contacts"
                ctaHref="/dashboard/crm/contacts"
              />
            }
          >
            <ContactsGrowthChart data={crm.contactsGrowth} />
          </ChartSlot>
          <ChartSlot
            hasData={crm.hasData}
            empty={
              <AnalyticsSectionEmpty
                illustration="crm"
                title="Deal creation trends"
                description="Create deals to see pipeline velocity and stage distribution."
                ctaLabel="Create a deal"
                ctaHref="/dashboard/crm/deals"
              />
            }
          >
            <DealsCreatedChart data={crm.dealsCreated} />
          </ChartSlot>
          <ChartSlot
            hasData={crm.pipelineByStage.length > 0}
            empty={
              <AnalyticsSectionEmpty
                illustration="crm"
                title="Pipeline by stage"
                description="Move deals through stages to unlock stage breakdown charts."
                ctaLabel="View pipeline"
                ctaHref="/dashboard/crm/deals"
              />
            }
          >
            <PipelineStageChart data={crm.pipelineByStage} />
          </ChartSlot>
        </div>
      </section>

      {/* Calendar */}
      <section className="mb-8 lg:mb-10">
        <SectionHeading
          emoji="📅"
          title="Calendar Analytics"
          subtitle="Meeting load and completion"
        />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-4">
          <StatPill label="This week" value={calendar.meetingsThisWeek} />
          <StatPill label="This month" value={calendar.meetingsThisMonth} />
          <StatPill label="Hours" value={formatHours(calendar.hoursInMeetings)} />
          <StatPill label="Upcoming" value={calendar.upcomingMeetings} />
          <StatPill label="Completion" value={formatPercent(calendar.completionRate)} />
        </div>
        <ChartSlot
          hasData={calendar.hasData}
          empty={
            <AnalyticsSectionEmpty
              illustration="meetings"
              title="No meetings tracked"
              description="Connect Google Calendar to analyze meeting load and completion rates."
              ctaLabel="Open Calendar"
              ctaHref="/dashboard/calendar"
            />
          }
        >
          <MeetingsTrendChart data={calendar.meetingsTrend} />
        </ChartSlot>
      </section>

      {/* Tasks */}
      <section className="mb-8 lg:mb-10">
        <SectionHeading
          emoji="✓"
          title="Task Analytics"
          subtitle="Completion rate and productivity"
        />
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          <StatPill label="Completed" value={tasks.completed} />
          <StatPill label="Pending" value={tasks.pending} />
          <StatPill label="Overdue" value={tasks.overdue} />
        </div>
        <ChartSlot
          hasData={tasks.hasData}
          empty={
            <AnalyticsSectionEmpty
              illustration="tasks"
              title="No tasks yet"
              description="Create tasks to track productivity trends and overdue items."
              ctaLabel="Open Tasks"
              ctaHref="/dashboard/tasks"
            />
          }
        >
          <TasksTrendChart data={tasks.productivityTrend} />
        </ChartSlot>
      </section>

      {/* Automations */}
      <section className="mb-8 lg:mb-10">
        <SectionHeading
          emoji="⚡"
          title="Automation Analytics"
          subtitle="Runs, success rate, and time saved"
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
          <StatPill label="Executed" value={automations.executed} />
          <StatPill label="Successful" value={automations.successful} />
          <StatPill label="Failed" value={automations.failed} />
          <StatPill
            label="Time saved"
            value={formatHours(automations.timeSavedHours)}
          />
        </div>
        {automations.mostUsed && (
          <p className={`text-sm ${dashboard.muted} mb-4`}>
            Most used:{" "}
            <span className="text-white font-medium">
              {automations.mostUsed.name}
            </span>{" "}
            ({automations.mostUsed.runs} runs)
          </p>
        )}
        <ChartSlot
          hasData={automations.hasData}
          empty={
            <AnalyticsSectionEmpty
              illustration="automations"
              title="No automation runs"
              description="Create and run workflows to measure time saved and success rates."
              ctaLabel="Build automation"
              ctaHref="/dashboard/automations"
            />
          }
        >
          <AutomationRunsChart data={automations.runsTrend} />
        </ChartSlot>
      </section>

      {/* Roxx AI */}
      <section className="mb-8 lg:mb-10">
        <SectionHeading
          emoji="✦"
          title="Roxx AI Analytics"
          subtitle="Conversations, actions, and prompt patterns"
        />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-4">
          <StatPill label="Conversations" value={roxx.totalConversations} />
          <StatPill label="Messages" value={roxx.messagesSent} />
          <StatPill
            label="Avg response"
            value={`${roxx.avgResponseTimeSec.toFixed(1)}s`}
          />
          <StatPill label="Actions" value={roxx.actionsCompleted} />
          <StatPill label="Success rate" value={formatPercent(roxx.successRate)} />
        </div>
        {roxx.topPrompts.length > 0 && (
          <div className={`${dashboard.cardLg} p-4 mb-4`}>
            <p className="text-sm font-semibold text-white mb-3">
              Most common prompts
            </p>
            <ul className="space-y-2">
              {roxx.topPrompts.map((p) => (
                <li
                  key={p.prompt}
                  className="flex items-center justify-between text-sm"
                >
                  <span className={dashboard.muted}>{p.prompt}</span>
                  <span className="text-white font-medium tabular-nums">
                    {p.count}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <ChartSlot
          hasData={roxx.hasData}
          empty={
            <AnalyticsSectionEmpty
              illustration="automations"
              title="Start using Roxx AI"
              description="Chat with Roxx to summarize inbox, draft replies, and automate actions."
              ctaLabel="Open Roxx AI"
              ctaHref="/dashboard/assistant"
            />
          }
        >
          <RoxxUsageChart data={roxx.usageTrend} />
        </ChartSlot>
      </section>
    </>
  );
}
