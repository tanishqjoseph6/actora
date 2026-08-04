"use client";

import { useEffect, useState } from "react";
import { Activity, CalendarDays, FileText, Gauge, HardDrive, ListChecks, Mail, Users, Workflow } from "lucide-react";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { formatBytes } from "@/lib/storage/limits";

type UsageResponse = {
  usage?: {
    nextResetAt: string;
    storage: { usedBytes: number; limitBytes: number; percent: number; remainingBytes: number };
    api: { callsUsed: number; monthlyLimit: number; remaining: number | null; percent: number };
    aiCredits: { used: number; limit: number; percent: number };
    teamMembers: { used: number; limit: number; percent: number };
    workspaces: { used: number; limit: number; percent: number };
    automationRuns: number;
    tasks: number;
    documents: number;
    crmContacts: number;
    meetings: number;
    calendarEvents: number;
  };
};

export function WorkspaceUsageGrid({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<UsageResponse["usage"]>();
  useEffect(() => {
    let mounted = true;
    fetch("/api/developers/usage")
      .then((response) => response.json())
      .then((body: UsageResponse) => {
        if (mounted) setData(body.usage);
      })
      .catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  const cards = data ? [
    { label: "Storage", value: `${formatBytes(data.storage.usedBytes)} / ${formatBytes(data.storage.limitBytes)}`, detail: `${formatBytes(data.storage.remainingBytes)} remaining`, percent: data.storage.percent, icon: HardDrive },
    { label: "API calls", value: `${data.api.callsUsed.toLocaleString("en-IN")} / ${Number.isFinite(data.api.monthlyLimit) ? data.api.monthlyLimit.toLocaleString("en-IN") : "∞"}`, detail: `${data.api.remaining === null ? "Unlimited" : data.api.remaining.toLocaleString("en-IN")} remaining`, percent: data.api.percent, icon: Activity },
    { label: "AI credits", value: `${data.aiCredits.used.toLocaleString("en-IN")} / ${Number.isFinite(data.aiCredits.limit) ? data.aiCredits.limit.toLocaleString("en-IN") : "∞"}`, detail: "Current cycle", percent: data.aiCredits.percent, icon: Gauge },
    { label: "Team members", value: String(data.teamMembers.used), detail: Number.isFinite(data.teamMembers.limit) ? `${data.teamMembers.limit} allowed` : "Unlimited", percent: data.teamMembers.percent, icon: Users },
    { label: "Workspaces", value: String(data.workspaces.used), detail: Number.isFinite(data.workspaces.limit) ? `${data.workspaces.limit} allowed` : "Unlimited", percent: data.workspaces.percent, icon: Users },
    { label: "Automation runs", value: data.automationRuns.toLocaleString("en-IN"), detail: "All time", percent: 0, icon: Workflow },
    { label: "Tasks", value: data.tasks.toLocaleString("en-IN"), detail: "Workspace records", percent: 0, icon: ListChecks },
    { label: "Documents", value: data.documents.toLocaleString("en-IN"), detail: "Stored files", percent: 0, icon: FileText },
    { label: "CRM contacts", value: data.crmContacts.toLocaleString("en-IN"), detail: "Workspace records", percent: 0, icon: Users },
    { label: "Meetings", value: data.meetings.toLocaleString("en-IN"), detail: "Workspace records", percent: 0, icon: CalendarDays },
    { label: "Calendar events", value: data.calendarEvents.toLocaleString("en-IN"), detail: "Workspace records", percent: 0, icon: Mail },
  ] : [];

  return (
    <div className={`${dashboard.cardLg} p-5 sm:p-6`}>
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="text-base font-semibold text-white">Workspace usage</h2><p className={`mt-1 text-sm ${dashboard.muted}`}>Usage and quotas across your current workspace.</p></div>
        {data && <p className="text-xs text-[#71717A]">Resets {new Date(data.nextResetAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>}
      </div>
      <div className={`mt-5 grid gap-3 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}`}>
        {cards.map(({ label, value, detail, percent, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-white/[0.06] bg-[#0A0A0A]/60 p-3.5">
            <div className="flex items-center justify-between"><p className="text-xs text-[#A1A1AA]">{label}</p><Icon className="h-4 w-4 text-[#3B82F6]" /></div>
            <p className="mt-2 text-lg font-semibold tabular-nums text-white">{value}</p>
            <p className="mt-1 truncate text-xs text-[#71717A]">{detail}</p>
            {percent > 0 && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]"><div className={`h-full rounded-full ${percent >= 80 ? "bg-amber-400" : "bg-[#3B82F6]"}`} style={{ width: `${Math.min(100, percent)}%` }} /></div>}
          </div>
        ))}
        {!data && <div className="col-span-full py-8 text-center text-sm text-[#71717A]">Loading workspace usage…</div>}
      </div>
    </div>
  );
}
