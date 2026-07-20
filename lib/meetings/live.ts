export type MeetingStatus = "scheduled" | "completed" | "cancelled";

export type Meeting = {
  id: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  attendees: string[];
  companyName?: string;
  location?: string;
  meetingLink?: string;
  type: "video" | "in-person" | "phone";
  status: MeetingStatus;
  organizer: string;
};

export type MeetingInput = {
  title: string;
  startAt: string;
  endAt: string;
  status?: MeetingStatus;
};

export function mapMeetingRow(row: {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  status: string;
  description?: string | null;
  location?: string | null;
  meeting_link?: string | null;
  attendees?: string[] | null;
}): Meeting {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    startAt: row.starts_at,
    endAt: row.ends_at ?? row.starts_at,
    attendees: row.attendees ?? [],
    location: row.location ?? undefined,
    meetingLink: row.meeting_link ?? undefined,
    type: row.meeting_link ? "video" : "video",
    status: (row.status as MeetingStatus) ?? "scheduled",
    organizer: "You",
  };
}

export function filterMeetingsBySearch(meetings: Meeting[], query: string): Meeting[] {
  const q = query.trim().toLowerCase();
  if (!q) return meetings;
  return meetings.filter(
    (m) =>
      m.title.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      (m.companyName ?? "").toLowerCase().includes(q)
  );
}
