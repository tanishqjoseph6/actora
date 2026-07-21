import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireCrmUserId } from "@/lib/crm/session";
import {
  crmSupabaseErrorResponse,
  runCrmRoute,
} from "@/lib/crm/api-response";
import { fetchContactForUser } from "@/lib/crm/contacts-query";
import { getContactEmailHistory } from "@/lib/crm/email-link";
import { generateCrmContactInsights } from "@/lib/openai";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const userId = await requireCrmUserId(request);
  if (userId instanceof NextResponse) return userId;

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

  const result = await runCrmRoute(
    "crm/contacts/[id]/insights GET",
    async () => {
      const { contact, error: contactError } = await fetchContactForUser(
        db,
        userId,
        id
      );

      if (contactError) {
        return crmSupabaseErrorResponse(
          "crm/contacts/[id]/insights GET contact",
          contactError,
          { userId, contactId: id }
        );
      }
      if (!contact) {
        return NextResponse.json({ error: "Contact not found." }, { status: 404 });
      }

      const [{ data: notes, error: notesError }, { data: activities, error: activitiesError }, emails] =
        await Promise.all([
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

      if (notesError) {
        console.error("[crm/contacts/[id]/insights GET] notes query failed:", {
          userId,
          contactId: id,
          error: notesError.message,
        });
      }
      if (activitiesError) {
        return crmSupabaseErrorResponse(
          "crm/contacts/[id]/insights GET activities",
          activitiesError,
          { userId, contactId: id }
        );
      }

      const { data: deals, error: dealsError } = await db
        .from("crm_deals")
        .select("title, stage, value")
        .eq("contact_id", id)
        .in("stage", ["lead", "qualified", "proposal", "negotiation"]);

      if (dealsError) {
        console.error("[crm/contacts/[id]/insights GET] deals query failed:", {
          userId,
          contactId: id,
          error: dealsError.message,
        });
      }

      try {
        const insights = await generateCrmContactInsights({
          name: contact.name,
          email: contact.email,
          company: contact.companyName,
          title: contact.title,
          status: contact.status,
          aiLeadScore: contact.aiLeadScore,
          recentNotes: (notes ?? []).map((n) => n.body ?? ""),
          recentActivities: (activities ?? []).map(
            (a) => `${a.activity_type ?? "note"}: ${a.title ?? ""}`
          ),
          recentEmails: emails.map((e) => `${e.subject} — ${e.snippet}`),
          openDeals: (deals ?? []).map(
            (d) => `${d.title} (${d.stage}, $${Number(d.value).toLocaleString()})`
          ),
        });

        return NextResponse.json({ insights });
      } catch (error) {
        console.error("[crm/contacts/[id]/insights GET]", {
          userId,
          contactId: id,
          error,
        });
        return NextResponse.json({
          insights: {
            summary: `${contact.name} is a ${contact.status} contact at ${contact.companyName || "an unknown company"}. AI lead score: ${contact.aiLeadScore}.`,
            nextSteps: [
              "Review recent email threads for open questions",
              "Schedule a follow-up if no reply in 3 days",
            ],
            riskLevel: "medium" as const,
            engagementScore: contact.aiLeadScore || 50,
          },
        });
      }
    },
    { userId, contactId: id }
  );

  return result instanceof NextResponse ? result : result;
}
