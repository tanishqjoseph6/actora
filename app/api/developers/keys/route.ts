import { NextRequest, NextResponse } from "next/server";
import { requireWorkspacePermission } from "@/lib/workspace/require";
import { isWritableRole } from "@/lib/workspace/permissions";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createApiKey } from "@/lib/public-api/auth";

export async function GET(request: NextRequest) {
  const auth = await requireWorkspacePermission("settings", request);
  if (!auth.ok) return auth.response;
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  const { data, error } = await db.from("api_keys").select("id,name,key_prefix,permissions,last_used_at,revoked_at,created_at").eq("workspace_id", auth.ctx.workspaceId).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Could not load API keys." }, { status: 500 });
  return NextResponse.json({ keys: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspacePermission("settings", request);
  if (!auth.ok) return auth.response;
  if (!isWritableRole(auth.ctx.role)) return NextResponse.json({ error: "API key management requires write access." }, { status: 403 });
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  if (!name || name.length > 120) return NextResponse.json({ error: "A key name of 1–120 characters is required." }, { status: 400 });
  const { secret, prefix, hash } = createApiKey();
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  const { data, error } = await db.from("api_keys").insert({ workspace_id: auth.ctx.workspaceId, created_by: auth.email, name, key_prefix: prefix, secret_hash: hash, permissions: Array.isArray(body.permissions) ? body.permissions.filter((p: unknown) => typeof p === "string") : [] }).select("id,name,key_prefix,permissions,last_used_at,revoked_at,created_at").single();
  if (error || !data) return NextResponse.json({ error: "Could not create API key." }, { status: 500 });
  return NextResponse.json({ key: data, secret }, { status: 201 });
}
