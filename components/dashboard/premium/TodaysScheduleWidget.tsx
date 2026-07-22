"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { DashboardMeetingPreview } from "@/lib/dashboard/types";
import { SkeletonListRows } from "@/components/ui/Skeleton";
import { dashboard } from "./dashboard-tokens";
import { useCalendarAccount } from "@/hooks/useCalendarAccount";

function formatMeetingTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

type TodaysScheduleWidgetProps = {
  todaysMeetings: DashboardMeetingPreview[];
  loading?: boolean;
};

export function TodaysScheduleWidget({
  todaysMeetings,
  loading = false,
}: TodaysScheduleWidgetProps) {
  const { connected, account, loading: calendarLoading } = useCalendarAccount();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const upcoming = todaysMeetings
    .filter((m) => new Date(m.startsAt).getTime() >= now - 15 * 60_000)
    .sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );
  const next = upcoming[0] ?? null;
  const rest = upcoming.slice(1, 4);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span
          className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            connected
              ? "border-[#3B82F6]/35 bg-[#3B82F6]/15 text-[#93C5FD]"
              : "border-white/[0.06] text-[#71717A]"
          }`}
        >
          {calendarLoading
            ? "…"
            : connected
              ? "Calendar synced"
              : "Calendar offline"}
        </span>
        <Link
          href="/dashboard/calendar"
          scroll={false}
          className="text-[11px] text-[#3B82F6] hover:text-[#93C5FD]"
        >
          Open
        </Link>
      </div>

      {loading ? (
        <SkeletonListRows rows={3} />
      ) : !next ? (
        <div>
          <p className={`text-sm ${dashboard.subtle}`}>
            No meetings scheduled today.
          </p>
          {!connected && (
            <Link
              href="/dashboard/settings#integrations"
              scroll={false}
              className="mt-2 inline-block text-xs text-[#3B82F6] hover:text-[#93C5FD]"
            >
              Connect Google Calendar
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border border-[#3B82F6]/25 bg-[#3B82F6]/10 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-[#93C5FD]">
              Next meeting
            </p>
            <p className="mt-1 text-sm font-medium text-white">{next.title}</p>
            <p className="text-xs text-[#A1A1AA]">
              {formatMeetingTime(next.startsAt)}
              {account?.accountEmail ? ` · ${account.accountEmail}` : ""}
            </p>
          </div>
          {rest.length > 0 && (
            <ul className="space-y-2">
              {rest.map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <span className="shrink-0 pt-0.5 font-mono text-xs tabular-nums text-[#2563EB]">
                    {formatMeetingTime(item.startsAt)}
                  </span>
                  <p className="truncate text-sm text-white">{item.title}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
