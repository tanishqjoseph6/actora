import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { listStoredCalendarEvents } from "@/lib/calendar/meetings-store";
import { fetchDealsEnriched } from "@/lib/crm/repository";
import type { ReplyBusinessContext } from "./prompts";

function extractEmail(from: string): string | null {
  const angle = from.match(/<([^>]+)>/);
  if (angle?.[1]?.includes("@")) return angle[1].trim().toLowerCase();
  const plain = from.trim().toLowerCase();
  return plain.includes("@") ? plain : null;
}

/**
 * Lightweight CRM / calendar / task snapshot for email reply intelligence.
 * Failures are swallowed — reply generation must still succeed.
 */
export async function buildReplyBusinessContext(
  userId: string,
  sender: string
): Promise<ReplyBusinessContext | null> {
  const email = extractEmail(sender);
  const db = getSupabaseAdmin();

  try {
    const [deals, meetings, contactResult, tasksResult] = await Promise.all([
      fetchDealsEnriched(userId).catch(() => []),
      listStoredCalendarEvents(userId, {
        from: new Date().toISOString(),
        to: new Date(Date.now() + 14 * 24 * 60 * 60_000).toISOString(),
      }).catch(() => []),
      email && db
        ? db
            .from("crm_contacts")
            .select("id, name, email, company_id, title, company_name")
            .eq("user_id", userId)
            .ilike("email", email)
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      db
        ? db
            .from("tasks")
            .select("title, status, due_date")
            .eq("user_id", userId)
            .neq("status", "done")
            .order("due_date", { ascending: true })
            .limit(5)
        : Promise.resolve({ data: [] }),
    ]);

    const contact = (contactResult as { data?: {
      name?: string;
      email?: string;
      title?: string;
      company_id?: string | null;
      company_name?: string | null;
    } | null }).data;

    let companyName: string | null = contact?.company_name ?? null;
    if (!companyName && contact?.company_id && db) {
      const { data: company } = await db
        .from("crm_companies")
        .select("name")
        .eq("id", contact.company_id)
        .maybeSingle();
      companyName = (company as { name?: string } | null)?.name ?? null;
    }

    const openStages = new Set(["lead", "qualified", "proposal", "negotiation"]);
    const openDeals = deals
      .filter((d) => openStages.has(d.stage))
      .slice(0, 5)
      .map((d) => `${d.title} (${d.stage}, $${d.value.toLocaleString()})`)
      .join("; ");

    const upcoming = meetings
      .slice(0, 5)
      .map((m) => `${m.title} @ ${new Date(m.startAt).toLocaleString()}`)
      .join("; ");

    const tasks = ((tasksResult as { data?: unknown[] }).data ?? [])
      .map((row) => {
        const r = row as { title: string; due_date: string };
        return `${r.title} (due ${new Date(r.due_date).toLocaleDateString()})`;
      })
      .join("; ");

    const ctx: ReplyBusinessContext = {
      crmContact: contact
        ? `${contact.name ?? "Contact"}${contact.title ? ` · ${contact.title}` : ""}${contact.email ? ` <${contact.email}>` : ""}`
        : null,
      crmCompany: companyName,
      openDeals: openDeals || null,
      upcomingMeetings: upcoming || null,
      openTasks: tasks || null,
      workspaceNotes: null,
    };

    if (
      !ctx.crmContact &&
      !ctx.crmCompany &&
      !ctx.openDeals &&
      !ctx.upcomingMeetings &&
      !ctx.openTasks
    ) {
      return null;
    }

    return ctx;
  } catch (err) {
    console.error("[email-reply] business context failed:", err);
    return null;
  }
}
