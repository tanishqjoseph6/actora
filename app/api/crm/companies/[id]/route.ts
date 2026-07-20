import { NextRequest, NextResponse } from "next/server";
import { getCrmUserId, clampScore } from "@/lib/crm/auth";
import {
  normalizeCrmCompany,
  type CrmCompanyInput,
} from "@/lib/crm/entities-live";
import { countContactsByCompany, fetchCompaniesWithStats } from "@/lib/crm/repository";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = { params: Promise<{ id: string }> };

const COMPANY_SELECT =
  "id, user_id, name, industry, size, status, website, address, notes, revenue, employee_count, owner, ai_score, created_at";

export async function GET(_request: NextRequest, context: RouteContext) {
  const userId = await getCrmUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { id } = await context.params;

  const { data, error } = await db
    .from("crm_companies")
    .select(COMPANY_SELECT)
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  const all = await fetchCompaniesWithStats(userId);
  const stats = all.find((c) => c.id === id);

  const { data: contacts } = await db
    .from("crm_contacts")
    .select(
      "id, user_id, name, email, phone, title, company_id, company_name, owner, status, ai_lead_score, created_at, updated_at"
    )
    .eq("user_id", userId)
    .eq("company_id", id)
    .order("name");

  return NextResponse.json({
    company: normalizeCrmCompany(data, {
      openDeals: stats?.openDeals ?? 0,
      totalPipeline: stats?.totalPipeline ?? 0,
    }),
    contacts: contacts ?? [],
    contactsCount: await countContactsByCompany(userId, id),
  });
}

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
  const body = (await request.json()) as CrmCompanyInput;
  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
    }
    updates.name = name;
  }
  if (body.industry !== undefined) updates.industry = body.industry.trim();
  if (body.size !== undefined) updates.size = body.size;
  if (body.status !== undefined) updates.status = body.status;
  if (body.website !== undefined) updates.website = body.website.trim();
  if (body.address !== undefined) updates.address = body.address.trim();
  if (body.notes !== undefined) updates.notes = body.notes.trim();
  if (body.revenue !== undefined) updates.revenue = body.revenue;
  if (body.employeeCount !== undefined) updates.employee_count = body.employeeCount;
  if (body.owner !== undefined) updates.owner = body.owner.trim();
  if (body.aiScore !== undefined) updates.ai_score = clampScore(body.aiScore);

  const { data, error } = await db
    .from("crm_companies")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select(COMPANY_SELECT)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  return NextResponse.json({ company: normalizeCrmCompany(data) });
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
    .from("crm_companies")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
