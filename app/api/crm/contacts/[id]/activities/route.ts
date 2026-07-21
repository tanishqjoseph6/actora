import { NextResponse } from "next/server";
import { getCrmUserId, formatRelativeTime } from "@/lib/crm/auth";
import {
  crmSupabaseErrorResponse,
  runCrmRoute,
} from "@/lib/crm/api-response";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const userId = await getCrmUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ activities: [] });
  }

  const { id } = await context.params;

  const result = await runCrmRoute(
    "crm/contacts/[id]/activities GET",
    async () => {
      const { data, error } = await db
        .from("crm_activities")
        .select(
          "id, contact_id, deal_id, activity_type, title, body, metadata, created_at"
        )
        .eq("user_id", userId)
        .eq("contact_id", id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        return crmSupabaseErrorResponse(
          "crm/contacts/[id]/activities GET",
          error,
          { userId, contactId: id }
        );
      }

      return NextResponse.json({
        activities: (data ?? []).map((row) => ({
          id: row.id,
          contactId: row.contact_id,
          dealId: row.deal_id,
          type: row.activity_type ?? "note",
          title: row.title ?? "",
          body: row.body ?? "",
          metadata: row.metadata ?? {},
          createdAt: row.created_at,
          relativeTime: row.created_at
            ? formatRelativeTime(row.created_at)
            : "Unknown",
        })),
      });
    },
    { userId, contactId: id }
  );

  return result instanceof NextResponse ? result : result;
}
