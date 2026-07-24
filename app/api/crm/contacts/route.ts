import { NextRequest, NextResponse } from "next/server";
import { clampScore } from "@/lib/crm/auth";
import { requireCrmUserId, requireCrmWriteUserId } from "@/lib/crm/session";
import {
  crmErrorResponse,
  crmSupabaseErrorResponse,
  runCrmRoute,
} from "@/lib/crm/api-response";
import { listContactsForUser } from "@/lib/crm/contacts-query";
import {
  CONTACT_SELECT,
  normalizeCrmContact,
  type CrmContactInput,
} from "@/lib/crm/live";
import { dispatchAutomationTrigger } from "@/lib/automations/dispatcher";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const userId = await requireCrmUserId(request);
  if (userId instanceof NextResponse) return userId;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const result = await runCrmRoute("crm/contacts GET", async () => {
    const { contacts, error } = await listContactsForUser(db, userId);
    if (error) {
      return crmSupabaseErrorResponse("crm/contacts GET", error, { userId });
    }
    return NextResponse.json({ contacts });
  }, { userId });

  return result instanceof NextResponse ? result : result;
}

export async function POST(request: NextRequest) {
  const userId = await requireCrmWriteUserId(request);
  if (userId instanceof NextResponse) return userId;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const result = await runCrmRoute("crm/contacts POST", async () => {
    const body = (await request.json()) as CrmContactInput;
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    let companyName = body.companyName?.trim() || null;
    if (body.companyId) {
      const { data: company } = await db
        .from("crm_companies")
        .select("name")
        .eq("id", body.companyId)
        .eq("user_id", userId)
        .maybeSingle();
      if (company?.name) companyName = company.name;
    }

    const { data, error } = await db
      .from("crm_contacts")
      .insert({
        user_id: userId,
        name,
        email: body.email?.trim() || null,
        phone: body.phone?.trim() ?? "",
        title: body.title?.trim() ?? "",
        company_id: body.companyId ?? null,
        company_name: companyName,
        owner: body.owner?.trim() ?? "",
        status: body.status ?? "lead",
        ai_lead_score: clampScore(body.aiLeadScore),
      })
      .select(CONTACT_SELECT)
      .single();

    if (error) {
      return crmSupabaseErrorResponse("crm/contacts POST", error, { userId });
    }

    const contact = normalizeCrmContact(data);
    if (!contact) {
      return crmErrorResponse(
        "crm/contacts POST",
        new Error("Contact was created but could not be normalized."),
        { userId }
      );
    }

    if (contact.status === "lead") {
      void dispatchAutomationTrigger(userId, "new-lead", {
        name: contact.name,
        email: contact.email,
        company: contact.companyName,
        companyName: contact.companyName,
        contactId: contact.id,
        score: contact.aiLeadScore,
        source: "crm",
      }).catch((err) =>
        console.error("[automations] new-lead dispatch failed:", err)
      );
    }

    return NextResponse.json({ contact }, { status: 201 });
  }, { userId });

  return result instanceof NextResponse ? result : result;
}
