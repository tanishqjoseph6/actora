import { NextRequest, NextResponse } from "next/server";
import { getCrmUserId, clampScore } from "@/lib/crm/auth";
import {
  normalizeCrmCompany,
  type CrmCompanyInput,
} from "@/lib/crm/entities-live";
import { fetchCompaniesWithStats } from "@/lib/crm/repository";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const userId = await getCrmUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const companies = await fetchCompaniesWithStats(userId);
  return NextResponse.json({ companies });
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

  const body = (await request.json()) as CrmCompanyInput;
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const { data, error } = await db
    .from("crm_companies")
    .insert({
      user_id: userId,
      name,
      industry: body.industry?.trim() ?? "",
      size: body.size ?? "smb",
      status: body.status ?? "prospect",
      website: body.website?.trim() ?? "",
      address: body.address?.trim() ?? "",
      notes: body.notes?.trim() ?? "",
      revenue: body.revenue ?? 0,
      employee_count: body.employeeCount ?? 0,
      owner: body.owner?.trim() ?? "",
      ai_score: clampScore(body.aiScore),
    })
    .select(
      "id, user_id, name, industry, size, status, website, address, notes, revenue, employee_count, owner, ai_score, created_at"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { company: normalizeCrmCompany(data) },
    { status: 201 }
  );
}
