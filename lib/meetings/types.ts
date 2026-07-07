export type MeetingType = "video" | "in-person" | "phone";

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
  type: MeetingType;
  status: MeetingStatus;
  organizer: string;
};
