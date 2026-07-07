"use client";

import { useEffect, useMemo, useState } from "react";
import { PremiumMetricCard } from "@/components/dashboard/premium/PremiumMetricCard";
import { MeetingsHeader } from "@/components/meetings/MeetingsHeader";
import { MeetingsContentSkeleton } from "@/components/meetings/MeetingsContentSkeleton";
import { MeetingsWeekCalendar } from "@/components/meetings/MeetingsWeekCalendar";
import { UpcomingMeetingsSection } from "@/components/meetings/UpcomingMeetingsSection";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { filterMeetingsBySearch, type Meeting, type MeetingInput } from "@/lib/meetings/live";
import { computeMeetingMetrics, startOfDay } from "@/lib/meetings/utils";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

export default function MeetingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [dayFilterActive, setDayFilterActive] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);
  const [form, setForm] = useState<MeetingInput>({
    title: "",
    startAt: "",
    endAt: "",
    status: "scheduled",
  });

  useEffect(() => {
    void loadMeetings();
  }, []);

  async function loadMeetings() {
    setLoading(true);
    try {
      const res = await fetch("/api/meetings");
      const json = (await res.json()) as { meetings?: Meeting[] };
      setMeetings(json.meetings ?? []);
    } finally {
      setLoading(false);
    }
  }

  const visibleMeetings = useMemo(
    () => filterMeetingsBySearch(meetings, search),
    [meetings, search]
  );

  const metrics = useMemo(
    () => computeMeetingMetrics(visibleMeetings),
    [visibleMeetings]
  );

  const handleSelectDay = (day: Date) => {
    setSelectedDay(day);
    setDayFilterActive(true);
  };

  const handleClearDayFilter = () => {
    setDayFilterActive(false);
    setSelectedDay(startOfDay(new Date()));
  };

  function openCreate() {
    setEditing(null);
    const now = new Date();
    const start = new Date(now.getTime() + 30 * 60_000);
    const end = new Date(start.getTime() + 30 * 60_000);
    setForm({
      title: "",
      startAt: start.toISOString().slice(0, 16),
      endAt: end.toISOString().slice(0, 16),
      status: "scheduled",
    });
    setShowForm(true);
  }

  function openEdit(meeting: Meeting) {
    setEditing(meeting);
    setForm({
      title: meeting.title,
      startAt: meeting.startAt.slice(0, 16),
      endAt: meeting.endAt.slice(0, 16),
      status: meeting.status,
    });
    setShowForm(true);
  }

  async function saveMeeting() {
    if (!form.title.trim() || !form.startAt || !form.endAt) return;
    setSaving(true);
    const url = editing ? `/api/meetings/${editing.id}` : "/api/meetings";
    const method = editing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        status: form.status,
      }),
    });
    setSaving(false);
    if (!res.ok) return;

    setShowForm(false);
    await loadMeetings();
  }

  async function deleteMeeting(meeting: Meeting) {
    const confirmed = window.confirm(`Delete "${meeting.title}"?`);
    if (!confirmed) return;
    await fetch(`/api/meetings/${meeting.id}`, { method: "DELETE" });
    await loadMeetings();
  }

  return (
    <FeatureGate feature="meetings" fullPage>
      <>
        <MeetingsHeader onSchedule={openCreate} />

        <div className="mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meetings..."
            className={`${dashboard.input} px-4 py-3 w-full`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
          <PremiumMetricCard title="This week" value={metrics.thisWeek} loading={loading} delay={0} />
          <PremiumMetricCard title="Today" value={metrics.today} loading={loading} delay={0.05} />
          <PremiumMetricCard title="Hours scheduled" value={metrics.hoursScheduled} loading={loading} delay={0.1} />
          <PremiumMetricCard title="Video calls" value={metrics.videoCalls} loading={loading} delay={0.15} />
        </div>

        <div className="space-y-6 lg:space-y-8">
          {loading ? (
            <MeetingsContentSkeleton />
          ) : (
            <>
              <MeetingsWeekCalendar
                meetings={visibleMeetings}
                selectedDay={selectedDay}
                onSelectDay={handleSelectDay}
              />

              <UpcomingMeetingsSection
                meetings={visibleMeetings}
                selectedDay={selectedDay}
                dayFilterActive={dayFilterActive}
                onClearDayFilter={handleClearDayFilter}
                onEditMeeting={openEdit}
                onDeleteMeeting={deleteMeeting}
              />
            </>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className={`${dashboard.panelLg} w-full max-w-xl`}>
              <h3 className="text-xl font-bold text-white mb-4">
                {editing ? "Edit meeting" : "Create meeting"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Meeting title"
                  className={`${dashboard.input} px-3 py-2 sm:col-span-2`}
                />
                <input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                  className={`${dashboard.input} px-3 py-2`}
                />
                <input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
                  className={`${dashboard.input} px-3 py-2`}
                />
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      status: e.target.value as Meeting["status"],
                    }))
                  }
                  className={`${dashboard.input} px-3 py-2 sm:col-span-2`}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className={`${dashboard.btnSecondary} px-4 py-2`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving || !form.title.trim()}
                  onClick={() => void saveMeeting()}
                  className={`${dashboard.btnPrimary} px-4 py-2 disabled:opacity-60`}
                >
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    </FeatureGate>
  );
}
