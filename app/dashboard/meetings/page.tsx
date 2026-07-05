"use client";

import { useEffect, useMemo, useState } from "react";
import { PremiumMetricCard } from "@/components/dashboard/premium/PremiumMetricCard";
import { MeetingsHeader } from "@/components/meetings/MeetingsHeader";
import { MeetingsWeekCalendar } from "@/components/meetings/MeetingsWeekCalendar";
import { UpcomingMeetingsSection } from "@/components/meetings/UpcomingMeetingsSection";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { MOCK_MEETINGS } from "@/lib/meetings/mock-data";
import { computeMeetingMetrics, startOfDay } from "@/lib/meetings/utils";

export default function MeetingsPage() {
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [dayFilterActive, setDayFilterActive] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 280);
    return () => clearTimeout(timer);
  }, []);

  const metrics = useMemo(() => computeMeetingMetrics(MOCK_MEETINGS), []);

  const handleSelectDay = (day: Date) => {
    setSelectedDay(day);
    setDayFilterActive(true);
  };

  const handleClearDayFilter = () => {
    setDayFilterActive(false);
    setSelectedDay(startOfDay(new Date()));
  };

  return (
    <FeatureGate feature="meetings" fullPage>
    <>
      <MeetingsHeader />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
        <PremiumMetricCard
          title="This week"
          value={metrics.thisWeek}
          trend={12}
          loading={loading}
          delay={0}
        />
        <PremiumMetricCard
          title="Today"
          value={metrics.today}
          trend={metrics.today > 0 ? 8 : 0}
          loading={loading}
          delay={0.05}
        />
        <PremiumMetricCard
          title="Hours scheduled"
          value={metrics.hoursScheduled}
          trend={5}
          loading={loading}
          delay={0.1}
        />
        <PremiumMetricCard
          title="Video calls"
          value={metrics.videoCalls}
          trend={3}
          loading={loading}
          delay={0.15}
        />
      </div>

      <div className="space-y-6 lg:space-y-8">
        <MeetingsWeekCalendar
          meetings={MOCK_MEETINGS}
          selectedDay={selectedDay}
          onSelectDay={handleSelectDay}
        />

        <UpcomingMeetingsSection
          meetings={MOCK_MEETINGS}
          selectedDay={selectedDay}
          dayFilterActive={dayFilterActive}
          onClearDayFilter={handleClearDayFilter}
        />
      </div>
    </>
    </FeatureGate>
  );
}
