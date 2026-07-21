import { NextRequest, NextResponse } from "next/server";
import { clampScore } from "@/lib/crm/auth";
import { requireCrmUserId } from "@/lib/crm/session";
import {
  crmErrorResponse,
  crmSupabaseErrorResponse,
  runCrmRoute,
} from "@/lib/crm/api-response";
import { fetchContactForUser } from "@/lib/crm/contacts-query";
import {
  CONTACT_SELECT,
  normalizeCrmContact,
  type CrmContactInput,
} from "@/lib/crm/live";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = await requireCrmUserId(request);
  if (userId instanceof NextResponse) return userId;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { id } = await context.params;

  const result = await runCrmRoute(
    "crm/contacts/[id] PATCH",
    async () => {
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
        return crmSupabaseErrorResponse("crm/contacts/[id] PATCH", error, {
          userId,
          contactId: id,
        });
      }
      if (!data) {
        return NextResponse.json({ error: "Contact not found." }, { status: 404 });
      }

      const contact = normalizeCrmContact(data);
      if (!contact) {
        return crmErrorResponse(
          "crm/contacts/[id] PATCH",
          new Error("Contact was updated but could not be normalized."),
          { userId, contactId: id }
        );
      }

      return NextResponse.json({ contact });
    },
    { userId, contactId: id }
  );

  return result instanceof NextResponse ? result : result;
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const userId = await requireCrmUserId(request);
  if (userId instanceof NextResponse) return userId;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { id } = await context.params;

  const result = await runCrmRoute(
    "crm/contacts/[id] DELETE",
    async () => {
      const { error } = await db
        .from("crm_contacts")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        return crmSupabaseErrorResponse("crm/contacts/[id] DELETE", error, {
          userId,
          contactId: id,
        });
      }

      return NextResponse.json({ deleted: true });
    },
    { userId, contactId: id }
  );

  return result instanceof NextResponse ? result : result;
}
