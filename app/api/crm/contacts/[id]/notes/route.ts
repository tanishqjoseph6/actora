import { NextRequest, NextResponse } from "next/server";
import { getCrmUserId } from "@/lib/crm/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const userId = await getCrmUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ notes: [] });
  }

  const { id } = await context.params;

  const { data, error } = await db
    .from("crm_notes")
    .select("id, contact_id, deal_id, body, created_at")
    .eq("user_id", userId)
    .eq("contact_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    notes: (data ?? []).map((row) => ({
      id: row.id,
      contactId: row.contact_id,
      dealId: row.deal_id,
      body: row.body,
      createdAt: row.created_at,
    })),
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const userId = await getCrmUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { body?: string; dealId?: string | null };
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await db.from("crm_activities").insert({
    user_id: userId,
    contact_id: id,
    deal_id: body.dealId ?? null,
    activity_type: "note",
    title: "Note added",
    body: noteBody.slice(0, 200),
    metadata: { noteId: data.id },
  });

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
}
