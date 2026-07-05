import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { MOCK_CONTACTS } from "@/lib/crm/mock-data";
import { MOCK_MEETINGS } from "@/lib/meetings/mock-data";

/** Seed demo CRM contacts and meetings into Supabase for a new user workspace. */
export async function ensureDashboardSeed(userId: string): Promise<void> {
  const db = getSupabaseAdmin();
  if (!db) return;

  const { count: contactCount, error: contactCountError } = await db
    .from("crm_contacts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (contactCountError) {
    const msg = contactCountError.message.toLowerCase();
    if (msg.includes("crm_contacts") && msg.includes("does not exist")) return;
    throw new Error(contactCountError.message);
  }

  if ((contactCount ?? 0) === 0) {
    const rows = MOCK_CONTACTS.map((contact) => ({
      user_id: userId,
      name: contact.name,
      email: contact.email,
      company_name: contact.companyName,
      status: contact.status,
      ai_lead_score: contact.aiLeadScore,
    }));

    const { error } = await db.from("crm_contacts").insert(rows);
    if (error && !error.message.toLowerCase().includes("does not exist")) {
      console.error("[dashboard] Failed to seed contacts:", error.message);
    }
  }

  const { count: meetingCount, error: meetingCountError } = await db
    .from("meetings")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (meetingCountError) {
    const msg = meetingCountError.message.toLowerCase();
    if (msg.includes("meetings") && msg.includes("does not exist")) return;
    throw new Error(meetingCountError.message);
  }

  if ((meetingCount ?? 0) === 0) {
    const rows = MOCK_MEETINGS.filter((m) => m.status !== "cancelled").map(
      (meeting) => ({
        user_id: userId,
        title: meeting.title,
        starts_at: meeting.startAt,
        ends_at: meeting.endAt,
        status: meeting.status === "cancelled" ? "cancelled" : "scheduled",
      })
    );

    const { error } = await db.from("meetings").insert(rows);
    if (error && !error.message.toLowerCase().includes("does not exist")) {
      console.error("[dashboard] Failed to seed meetings:", error.message);
    }
  }
}
