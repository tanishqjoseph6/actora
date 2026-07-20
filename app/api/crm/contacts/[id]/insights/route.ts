import { NextResponse } from "next/server";
import { getCrmUserId } from "@/lib/crm/auth";
import { getContactEmailHistory } from "@/lib/crm/email-link";
import { generateCrmContactInsights } from "@/lib/openai";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const userId = await getCrmUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({
      insights: {
        summary: "Connect Supabase to enable AI insights.",
        nextSteps: [],
        riskLevel: "low" as const,
        engagementScore: 0,
      },
    });
  }

  const { id } = await context.params;

  const { data: contact } = await db
    .from("crm_contacts")
    .select("name, email, company_name, status, ai_lead_score, title")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!contact) {
    return NextResponse.json({ error: "Contact not found." }, { status: 404 });
  }

  const [{ data: notes }, { data: activities }, emails] = await Promise.all([
    db
      .from("crm_notes")
      .select("body, created_at")
      .eq("contact_id", id)
      .order("created_at", { ascending: false })
      .limit(5),
    db
      .from("crm_activities")
      .select("activity_type, title, body, created_at")
      .eq("contact_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
    getContactEmailHistory(userId, id),
  ]);

  const { data: deals } = await db
    .from("crm_deals")
    .select("title, stage, value")
    .eq("contact_id", id)
    .in("stage", ["lead", "qualified", "proposal", "negotiation"]);

  try {
    const insights = await generateCrmContactInsights({
      name: contact.name,
      email: contact.email ?? "",
      company: contact.company_name ?? "",
      title: contact.title ?? "",
      status: contact.status,
      aiLeadScore: contact.ai_lead_score ?? 0,
      recentNotes: (notes ?? []).map((n) => n.body),
      recentActivities: (activities ?? []).map(
        (a) => `${a.activity_type}: ${a.title}`
      ),
      recentEmails: emails.map((e) => `${e.subject} — ${e.snippet}`),
      openDeals: (deals ?? []).map(
        (d) => `${d.title} (${d.stage}, $${Number(d.value).toLocaleString()})`
      ),
    });

    return NextResponse.json({ insights });
  } catch (error) {
    console.error("[crm/insights]", error);
    return NextResponse.json({
      insights: {
        summary: `${contact.name} is a ${contact.status} contact at ${contact.company_name || "an unknown company"}. AI lead score: ${contact.ai_lead_score ?? 0}.`,
        nextSteps: [
          "Review recent email threads for open questions",
          "Schedule a follow-up if no reply in 3 days",
        ],
        riskLevel: "medium" as const,
        engagementScore: contact.ai_lead_score ?? 50,
      },
    });
  }
}
