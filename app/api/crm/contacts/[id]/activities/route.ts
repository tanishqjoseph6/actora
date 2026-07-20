import { NextResponse } from "next/server";
import { getCrmUserId, formatRelativeTime } from "@/lib/crm/auth";
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

  const { data, error } = await db
    .from("crm_activities")
    .select("id, contact_id, deal_id, activity_type, title, body, metadata, created_at")
    .eq("user_id", userId)
    .eq("contact_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    activities: (data ?? []).map((row) => ({
      id: row.id,
      contactId: row.contact_id,
      dealId: row.deal_id,
      type: row.activity_type,
      title: row.title,
      body: row.body,
      metadata: row.metadata ?? {},
      createdAt: row.created_at,
      relativeTime: formatRelativeTime(row.created_at),
    })),
  });
}
