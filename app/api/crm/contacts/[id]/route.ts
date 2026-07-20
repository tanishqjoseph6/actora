import { NextRequest, NextResponse } from "next/server";
import { getCrmUserId, clampScore } from "@/lib/crm/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  CONTACT_SELECT,
  normalizeCrmContact,
  type CrmContactInput,
} from "@/lib/crm/live";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = await getCrmUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as CrmContactInput;
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
    }
    updates.name = name;
  }
  if (body.email !== undefined) updates.email = body.email.trim() || null;
  if (body.phone !== undefined) updates.phone = body.phone.trim();
  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.owner !== undefined) updates.owner = body.owner.trim();
  if (body.companyName !== undefined) {
    updates.company_name = body.companyName.trim() || null;
  }
  if (body.companyId !== undefined) {
    updates.company_id = body.companyId;
    if (body.companyId) {
      const { data: company } = await db
        .from("crm_companies")
        .select("name")
        .eq("id", body.companyId)
        .eq("user_id", userId)
        .maybeSingle();
      if (company?.name) updates.company_name = company.name;
    }
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
    .select(CONTACT_SELECT)
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
  const userId = await getCrmUserId();
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
