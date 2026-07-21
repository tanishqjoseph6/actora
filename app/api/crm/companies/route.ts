import { NextRequest, NextResponse } from "next/server";
import { getCrmUserId, clampScore } from "@/lib/crm/auth";
import {
  crmErrorResponse,
  crmSupabaseErrorResponse,
  runCrmRoute,
} from "@/lib/crm/api-response";
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

  const result = await runCrmRoute(
    "crm/companies GET",
    async () => {
      const companies = await fetchCompaniesWithStats(userId);
      return NextResponse.json({ companies });
    },
    { userId }
  );

  return result instanceof NextResponse ? result : result;
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

  const result = await runCrmRoute(
    "crm/companies POST",
    async () => {
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
        return crmSupabaseErrorResponse("crm/companies POST", error, { userId });
      }

      const company = normalizeCrmCompany(data);
      if (!company) {
        return crmErrorResponse(
          "crm/companies POST",
          new Error("Company was created but could not be normalized."),
          { userId }
        );
      }

      return NextResponse.json({ company }, { status: 201 });
    },
    { userId }
  );

  return result instanceof NextResponse ? result : result;
}
