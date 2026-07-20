import { createUserNotification } from "@/lib/notifications/repository";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

/**
 * Emit Calendar notifications for meetings whose reminder window has started.
 * Idempotent via reminder_sent_at. Safe when migration 016 is not applied yet.
 */
export async function processMeetingReminders(
  userId: string
): Promise<{ sent: number }> {
  const db = getSupabaseAdmin();
  if (!db) return { sent: 0 };

  const uid = normalizeSubscriptionUserId(userId);
  const now = Date.now();

  const { data, error } = await db
    .from("meetings")
    .select(
      "id, title, starts_at, reminder_minutes, reminder_sent_at, meeting_link, status"
    )
    .eq("user_id", uid)
    .eq("status", "scheduled")
    .is("reminder_sent_at", null)
    .gte("starts_at", new Date(now - 60_000).toISOString())
    .lte("starts_at", new Date(now + 24 * 60 * 60_000).toISOString());

  if (error || !data?.length) return { sent: 0 };

  let sent = 0;
  for (const meeting of data) {
    const minutes = meeting.reminder_minutes ?? 30;
    if (minutes <= 0) continue;

    const startMs = new Date(meeting.starts_at).getTime();
    const remindAt = startMs - minutes * 60_000;
    if (now < remindAt) continue;

    const minsLeft = Math.max(0, Math.round((startMs - now) / 60_000));
    const body =
      minsLeft <= 0
        ? "Your meeting is starting now."
        : `Starts in ${minsLeft} minute${minsLeft === 1 ? "" : "s"}.${
            meeting.meeting_link ? " Meet link ready." : ""
          }`;

    await createUserNotification(uid, {
      category: "Calendar",
      title: `Reminder: ${meeting.title}`,
      body,
      href: "/dashboard/calendar",
    });

    await db
      .from("meetings")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", meeting.id)
      .eq("user_id", uid);

    sent += 1;
  }

  return { sent };
}
