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
import { PIPELINE_STAGES } from "@/lib/crm/pipeline";
import type { DealStage } from "@/lib/crm/types";

type RouteContext = { params: Promise<{ id: string }> };

const VALID_STAGES = new Set(PIPELINE_STAGES.map((s) => s.id));

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = await requireCrmWriteUserId(request);
  if (userId instanceof NextResponse) return userId;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { id } = await context.params;

  const result = await runCrmRoute(
    "crm/deals/[id] PATCH",
    async () => {
      const body = (await request.json()) as CrmDealInput & { stage?: DealStage };

      const { data: existing } = await db
        .from("crm_deals")
        .select("stage, contact_id, title")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();

      if (!existing) {
        return NextResponse.json({ error: "Deal not found." }, { status: 404 });
      }

      const updates: Record<string, unknown> = {
        last_activity_at: new Date().toISOString(),
      };

      if (body.title !== undefined) {
        const title = body.title.trim();
        if (!title) {
          return NextResponse.json({ error: "Title cannot be empty." }, { status: 400 });
        }
        updates.title = title;
      }
      if (body.companyId !== undefined) updates.company_id = body.companyId;
      if (body.contactId !== undefined) updates.contact_id = body.contactId;
      if (body.stage !== undefined) {
        if (!VALID_STAGES.has(body.stage)) {
          return NextResponse.json({ error: "Invalid stage." }, { status: 400 });
        }
        updates.stage = body.stage;
      }
      if (body.value !== undefined) updates.value = body.value;
      if (body.probability !== undefined) updates.probability = body.probability;
      if (body.closeDate !== undefined) updates.close_date = body.closeDate || null;
      if (body.priority !== undefined) updates.priority = body.priority;
      if (body.owner !== undefined) updates.owner = body.owner.trim();
      if (body.aiScore !== undefined) updates.ai_score = clampScore(body.aiScore);
      if (body.labels !== undefined) updates.labels = body.labels;

      const { error } = await db
        .from("crm_deals")
        .update(updates)
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        return crmSupabaseErrorResponse("crm/deals/[id] PATCH", error, {
          userId,
          dealId: id,
        });
      }

      if (body.stage && body.stage !== existing.stage) {
        const stageLabel =
          PIPELINE_STAGES.find((s) => s.id === body.stage)?.label ?? body.stage;
        const activityInsert = await db.from("crm_activities").insert({
          user_id: userId,
          contact_id: existing.contact_id,
          deal_id: id,
          activity_type: "deal_stage",
          title: `Moved to ${stageLabel}`,
          body: existing.title ?? "",
          metadata: { from: existing.stage, to: body.stage },
        });

        if (activityInsert.error) {
          console.error("[crm/deals/[id] PATCH] activity insert failed:", {
            userId,
            dealId: id,
            error: activityInsert.error.message,
          });
        }
      }

      const deals = await fetchDealsEnriched(userId);
      const deal = deals.find((d) => d.id === id);

      return NextResponse.json({ deal: deal ?? null });
    },
    { userId, dealId: id }
  );

  return result instanceof NextResponse ? result : result;
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const userId = await requireCrmWriteUserId(request);
  if (userId instanceof NextResponse) return userId;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { id } = await context.params;

  const result = await runCrmRoute(
    "crm/deals/[id] DELETE",
    async () => {
      const { error } = await db
        .from("crm_deals")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        return crmSupabaseErrorResponse("crm/deals/[id] DELETE", error, {
          userId,
          dealId: id,
        });
      }

      return NextResponse.json({ deleted: true });
    },
    { userId, dealId: id }
  );

  return result instanceof NextResponse ? result : result;
}
