import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { normalizeCrmContact, type CrmContactInput } from "@/lib/crm/live";

type RouteContext = { params: Promise<{ id: string }> };

function clampScore(score: number | undefined): number {
  if (typeof score !== "number" || Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.email ?? null;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as CrmContactInput;
  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
    }
    updates.name = name;
  }
  if (body.email !== undefined) updates.email = body.email.trim() || null;
  if (body.companyName !== undefined) {
    updates.company_name = body.companyName.trim() || null;
  }
  if (body.status !== undefined) updates.status = body.status;
  if (body.aiLeadScore !== undefined) {
    updates.ai_lead_score = clampScore(body.aiLeadScore);
  }

  const { data, error } = await db
    .from("crm_contacts")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, user_id, name, email, company_name, status, ai_lead_score, created_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Contact not found." }, { status: 404 });
  }

  return NextResponse.json({ contact: normalizeCrmContact(data) });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { id } = await context.params;

  const { error } = await db
    .from("crm_contacts")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
