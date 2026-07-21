import { NextRequest, NextResponse } from "next/server";
import { requireCrmUserId } from "@/lib/crm/session";
import {
  crmSupabaseErrorResponse,
  runCrmRoute,
} from "@/lib/crm/api-response";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const userId = await requireCrmUserId(request);
  if (userId instanceof NextResponse) return userId;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ notes: [] });
  }

  const { id } = await context.params;

  const result = await runCrmRoute(
    "crm/contacts/[id]/notes GET",
    async () => {
      const { data, error } = await db
        .from("crm_notes")
        .select("id, contact_id, deal_id, body, created_at")
        .eq("user_id", userId)
        .eq("contact_id", id)
        .order("created_at", { ascending: false });

      if (error) {
        return crmSupabaseErrorResponse("crm/contacts/[id]/notes GET", error, {
          userId,
          contactId: id,
        });
      }

      return NextResponse.json({
        notes: (data ?? []).map((row) => ({
          id: row.id,
          contactId: row.contact_id,
          dealId: row.deal_id,
          body: row.body ?? "",
          createdAt: row.created_at,
        })),
      });
    },
    { userId, contactId: id }
  );

  return result instanceof NextResponse ? result : result;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const userId = await requireCrmUserId(request);
  if (userId instanceof NextResponse) return userId;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { id } = await context.params;

  const result = await runCrmRoute(
    "crm/contacts/[id]/notes POST",
    async () => {
      const body = (await request.json()) as {
        body?: string;
        dealId?: string | null;
      };
      const noteBody = body.body?.trim();
      if (!noteBody) {
        return NextResponse.json({ error: "Note body is required." }, { status: 400 });
      }

      const { data, error } = await db
        .from("crm_notes")
        .insert({
          user_id: userId,
          contact_id: id,
          deal_id: body.dealId ?? null,
          body: noteBody,
        })
        .select("id, contact_id, deal_id, body, created_at")
        .single();

      if (error) {
        return crmSupabaseErrorResponse("crm/contacts/[id]/notes POST", error, {
          userId,
          contactId: id,
        });
      }

      const activityInsert = await db.from("crm_activities").insert({
        user_id: userId,
        contact_id: id,
        deal_id: body.dealId ?? null,
        activity_type: "note",
        title: "Note added",
        body: noteBody.slice(0, 200),
        metadata: { noteId: data.id },
      });

      if (activityInsert.error) {
        console.error("[crm/contacts/[id]/notes POST] activity insert failed:", {
          userId,
          contactId: id,
          error: activityInsert.error.message,
        });
      }

      return NextResponse.json(
        {
          note: {
            id: data.id,
            contactId: data.contact_id,
            dealId: data.deal_id,
            body: data.body,
            createdAt: data.created_at,
          },
        },
        { status: 201 }
      );
    },
    { userId, contactId: id }
  );

  return result instanceof NextResponse ? result : result;
}
