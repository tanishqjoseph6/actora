import { NextRequest, NextResponse } from "next/server";
import { getCrmUserId, clampScore } from "@/lib/crm/auth";
import { type CrmDealInput } from "@/lib/crm/entities-live";
import { fetchDealsEnriched } from "@/lib/crm/repository";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { toPipelineDeal } from "@/lib/crm/entities-live";

export async function GET() {
  const userId = await getCrmUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const deals = await fetchDealsEnriched(userId);
  return NextResponse.json({
    deals,
    pipelineDeals: deals.map(toPipelineDeal),
  });
}

export async function POST(request: NextRequest) {
  const userId = await getCrmUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await db.from("crm_activities").insert({
    user_id: userId,
    contact_id: body.contactId ?? null,
    deal_id: data.id,
    activity_type: "deal_created",
    title: `Deal created: ${title}`,
    body: "",
    metadata: { stage: body.stage ?? "lead" },
  });

  const deals = await fetchDealsEnriched(userId);
  const deal = deals.find((d) => d.id === data.id);

  return NextResponse.json({ deal }, { status: 201 });
}
