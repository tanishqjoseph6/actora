import { NextRequest, NextResponse } from "next/server";
import { clampScore } from "@/lib/crm/auth";
import { requireCrmUserId, requireCrmWriteUserId } from "@/lib/crm/session";
import {
  crmSupabaseErrorResponse,
  runCrmRoute,
} from "@/lib/crm/api-response";
import { type CrmDealInput } from "@/lib/crm/entities-live";
import { fetchDealsEnriched } from "@/lib/crm/repository";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { toPipelineDeal } from "@/lib/crm/entities-live";

export async function GET(request: NextRequest) {
  const userId = await requireCrmUserId(request);
  if (userId instanceof NextResponse) return userId;

  const result = await runCrmRoute(
    "crm/deals GET",
    async () => {
      const deals = await fetchDealsEnriched(userId);
      return NextResponse.json({
        deals,
        pipelineDeals: deals
          .map(toPipelineDeal)
          .filter((deal): deal is NonNullable<typeof deal> => deal !== null),
      });
    },
    { userId }
  );

  return result instanceof NextResponse ? result : result;
}

export async function POST(request: NextRequest) {
  const userId = await requireCrmWriteUserId(request);
  if (userId instanceof NextResponse) return userId;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const result = await runCrmRoute(
    "crm/deals POST",
    async () => {
      const body = (await request.json()) as CrmDealInput;
      const title = body.title?.trim();
      if (!title) {
        return NextResponse.json({ error: "Title is required." }, { status: 400 });
      }

      const { data, error } = await db
        .from("crm_deals")
        .insert({
          user_id: userId,
          title,
          company_id: body.companyId ?? null,
          contact_id: body.contactId ?? null,
          stage: body.stage ?? "lead",
          value: body.value ?? 0,
          probability: body.probability ?? 10,
          close_date: body.closeDate ?? null,
          priority: body.priority ?? "medium",
          owner: body.owner?.trim() ?? "",
          ai_score: clampScore(body.aiScore),
          labels: body.labels ?? [],
        })
        .select("id")
        .single();

      if (error) {
        return crmSupabaseErrorResponse("crm/deals POST", error, { userId });
      }

      const activityInsert = await db.from("crm_activities").insert({
        user_id: userId,
        contact_id: body.contactId ?? null,
        deal_id: data.id,
        activity_type: "deal_created",
        title: `Deal created: ${title}`,
        body: "",
        metadata: { stage: body.stage ?? "lead" },
      });

      if (activityInsert.error) {
        console.error("[crm/deals POST] activity insert failed:", {
          userId,
          dealId: data.id,
          error: activityInsert.error.message,
        });
      }

      const deals = await fetchDealsEnriched(userId);
      const deal = deals.find((d) => d.id === data.id);

      return NextResponse.json({ deal: deal ?? null }, { status: 201 });
    },
    { userId }
  );

  return result instanceof NextResponse ? result : result;
}
