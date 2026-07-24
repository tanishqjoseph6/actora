import { NextRequest, NextResponse } from "next/server";
import { clampScore } from "@/lib/crm/auth";
import { requireCrmUserId, requireCrmWriteUserId } from "@/lib/crm/session";
import {
  crmErrorResponse,
  crmSupabaseErrorResponse,
  runCrmRoute,
} from "@/lib/crm/api-response";
import { mapCrmContacts } from "@/lib/crm/contacts-query";
import {
  CONTACT_SELECT,
  normalizeCrmCompany,
  type CrmCompanyInput,
} from "@/lib/crm/entities-live";
import { countContactsByCompany, fetchCompaniesWithStats } from "@/lib/crm/repository";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = { params: Promise<{ id: string }> };

const COMPANY_SELECT =
  "id, user_id, name, industry, size, status, website, address, notes, revenue, employee_count, owner, ai_score, created_at";

export async function GET(request: NextRequest, context: RouteContext) {
  const userId = await requireCrmUserId(request);
  if (userId instanceof NextResponse) return userId;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { id } = await context.params;

  const result = await runCrmRoute(
    "crm/companies/[id] GET",
    async () => {
      const { data, error } = await db
        .from("crm_companies")
        .select(COMPANY_SELECT)
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        return crmSupabaseErrorResponse("crm/companies/[id] GET", error, {
          userId,
          companyId: id,
        });
      }
      if (!data) {
        return NextResponse.json({ error: "Company not found." }, { status: 404 });
      }

      const all = await fetchCompaniesWithStats(userId);
      const stats = all.find((c) => c.id === id);
      const company = normalizeCrmCompany(data, {
        openDeals: stats?.openDeals ?? 0,
        totalPipeline: stats?.totalPipeline ?? 0,
      });

      if (!company) {
        return crmErrorResponse(
          "crm/companies/[id] GET",
          new Error("Company could not be normalized."),
          { userId, companyId: id }
        );
      }

      const { data: contacts, error: contactsError } = await db
        .from("crm_contacts")
        .select(CONTACT_SELECT)
        .eq("user_id", userId)
        .eq("company_id", id)
        .order("name");

      if (contactsError) {
        return crmSupabaseErrorResponse("crm/companies/[id] GET contacts", contactsError, {
          userId,
          companyId: id,
        });
      }

      return NextResponse.json({
        company,
        contacts: mapCrmContacts(contacts),
        contactsCount: await countContactsByCompany(userId, id),
      });
    },
    { userId, companyId: id }
  );

  return result instanceof NextResponse ? result : result;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = await requireCrmWriteUserId(request);
  if (userId instanceof NextResponse) return userId;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { id } = await context.params;

  const result = await runCrmRoute(
    "crm/companies/[id] PATCH",
    async () => {
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
        return crmSupabaseErrorResponse("crm/companies/[id] PATCH", error, {
          userId,
          companyId: id,
        });
      }
      if (!data) {
        return NextResponse.json({ error: "Company not found." }, { status: 404 });
      }

      const company = normalizeCrmCompany(data);
      if (!company) {
        return crmErrorResponse(
          "crm/companies/[id] PATCH",
          new Error("Company was updated but could not be normalized."),
          { userId, companyId: id }
        );
      }

      return NextResponse.json({ company });
    },
    { userId, companyId: id }
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
    "crm/companies/[id] DELETE",
    async () => {
      const { error } = await db
        .from("crm_companies")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        return crmSupabaseErrorResponse("crm/companies/[id] DELETE", error, {
          userId,
          companyId: id,
        });
      }

      return NextResponse.json({ deleted: true });
    },
    { userId, companyId: id }
  );

  return result instanceof NextResponse ? result : result;
}
