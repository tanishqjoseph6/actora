import { NextRequest, NextResponse } from "next/server";
import { getCrmUserId, clampScore } from "@/lib/crm/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  CONTACT_SELECT,
  normalizeCrmContact,
  type CrmContactInput,
} from "@/lib/crm/live";
import { dispatchAutomationTrigger } from "@/lib/automations/dispatcher";

export async function GET() {
  const userId = await getCrmUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ contacts: [] });
  }

  const { data, error } = await db
    .from("crm_contacts")
    .select(CONTACT_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    contacts: (data ?? []).map((row) => normalizeCrmContact(row)),
  });
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const contact = normalizeCrmContact(data);
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
}
