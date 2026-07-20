import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { parseSenderEmail } from "@/lib/gmail";
import { formatRelativeTime } from "./auth";

type InboxEmailSummary = {
  id: string;
  sender: string;
  subject: string;
  preview: string;
};

export async function linkInboxEmailsToCrm(
  userId: string,
  emails: InboxEmailSummary[]
): Promise<{ linked: number }> {
  const db = getSupabaseAdmin();
  if (!db || emails.length === 0) return { linked: 0 };

  const { data: contacts } = await db
    .from("crm_contacts")
    .select("id, email, name")
    .eq("user_id", userId)
    .not("email", "is", null);

  if (!contacts?.length) return { linked: 0 };

  const byEmail = new Map<string, { id: string; name: string }>();
  for (const contact of contacts) {
    const email = contact.email?.trim().toLowerCase();
    if (email) byEmail.set(email, { id: contact.id, name: contact.name });
  }

  let linked = 0;

  for (const message of emails) {
    const senderEmail = parseSenderEmail(message.sender).toLowerCase();
    const contact = byEmail.get(senderEmail);
    if (!contact) continue;

    const { data: openDeal } = await db
      .from("crm_deals")
      .select("id")
      .eq("user_id", userId)
      .eq("contact_id", contact.id)
      .in("stage", ["lead", "qualified", "proposal", "negotiation"])
      .order("last_activity_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await db.from("crm_email_links").upsert(
      {
        user_id: userId,
        gmail_message_id: message.id,
        contact_id: contact.id,
        deal_id: openDeal?.id ?? null,
        subject: message.subject,
        sender_email: senderEmail,
        sender_name: message.sender,
        snippet: message.preview,
        linked_at: new Date().toISOString(),
      },
      { onConflict: "user_id,gmail_message_id" }
    );

    if (error) continue;

    await db.from("crm_activities").insert({
      user_id: userId,
      contact_id: contact.id,
      deal_id: openDeal?.id ?? null,
      activity_type: "email",
      title: message.subject || "Email received",
      body: message.preview,
      metadata: { gmailMessageId: message.id, senderEmail },
    });

    if (openDeal?.id) {
      await db
        .from("crm_deals")
        .update({ last_activity_at: new Date().toISOString() })
        .eq("id", openDeal.id);
    }

    linked += 1;
  }

  return { linked };
}

export async function getContactEmailHistory(
  userId: string,
  contactId: string
) {
  const db = getSupabaseAdmin();
  if (!db) return [];

  const { data } = await db
    .from("crm_email_links")
    .select(
      "id, gmail_message_id, contact_id, deal_id, subject, sender_email, sender_name, snippet, linked_at"
    )
    .eq("user_id", userId)
    .eq("contact_id", contactId)
    .order("linked_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((row) => ({
    id: row.id,
    gmailMessageId: row.gmail_message_id,
    contactId: row.contact_id,
    dealId: row.deal_id,
    subject: row.subject,
    senderEmail: row.sender_email,
    senderName: row.sender_name,
    snippet: row.snippet,
    linkedAt: row.linked_at,
    relativeTime: formatRelativeTime(row.linked_at),
  }));
}
