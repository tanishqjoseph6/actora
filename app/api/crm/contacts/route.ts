import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { normalizeCrmContact, type CrmContactInput } from "@/lib/crm/live";

function clampScore(score: number | undefined): number {
  if (typeof score !== "number" || Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.email ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ contacts: [] });
  }

  const { data, error } = await db
    .from("crm_contacts")
    .select("id, user_id, name, email, company_name, status, ai_lead_score, created_at")
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
  const userId = await getUserId();
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

  const { data, error } = await db
    .from("crm_contacts")
    .insert({
      user_id: userId,
      name,
      email: body.email?.trim() || null,
      company_name: body.companyName?.trim() || null,
      status: body.status ?? "lead",
      ai_lead_score: clampScore(body.aiLeadScore),
    })
    .select("id, user_id, name, email, company_name, status, ai_lead_score, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contact: normalizeCrmContact(data) }, { status: 201 });
}
