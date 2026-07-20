"use client";

import dynamic from "next/dynamic";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { Skeleton } from "@/components/ui/Skeleton";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

const CalendarWorkspace = dynamic(
  () =>
    import("@/components/calendar/CalendarWorkspace").then(
      (m) => m.CalendarWorkspace
    ),
  {
    ssr: false,
    loading: () => (
      <div className={`${dashboard.panelLg} space-y-4`}>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    ),
  }
);

export default function CalendarPage() {
  return (
    <FeatureGate feature="meetings" fullPage>
      <CalendarWorkspace />
    </FeatureGate>
  );
}
