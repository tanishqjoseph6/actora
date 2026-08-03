import { NextRequest, NextResponse } from "next/server";
import { requireWorkspacePermission } from "@/lib/workspace/require";
import { isWritableRole } from "@/lib/workspace/permissions";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type Context = { params: Promise<{ id: string }> };
async function authWrite(request: NextRequest) {
  const auth = await requireWorkspacePermission("settings", request);
  if (!auth.ok) return auth;
  if (!isWritableRole(auth.ctx.role)) return { ok: false as const, response: NextResponse.json({ error: "Write access is required." }, { status: 403 }) };
  return auth;
}
export async function PATCH(request: NextRequest, context: Context) {
  const auth = await authWrite(request); if (!auth.ok) return auth.response;
  const { id } = await context.params; const body = await request.json(); const name = String(body.name ?? "").trim();
  if (!name || name.length > 120) return NextResponse.json({ error: "A key name of 1–120 characters is required." }, { status: 400 });
  const db = getSupabaseAdmin(); if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  const { data, error } = await db.from("api_keys").update({ name }).eq("id", id).eq("workspace_id", auth.ctx.workspaceId).select("id,name,key_prefix,permissions,last_used_at,revoked_at,created_at").maybeSingle();
  if (error) return NextResponse.json({ error: "Could not rename API key." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "API key not found." }, { status: 404 });
  return NextResponse.json({ key: data });
}
export async function DELETE(request: NextRequest, context: Context) {
  const auth = await authWrite(request); if (!auth.ok) return auth.response;
  const { id } = await context.params; const db = getSupabaseAdmin(); if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  const { error } = await db.from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", id).eq("workspace_id", auth.ctx.workspaceId);
  if (error) return NextResponse.json({ error: "Could not revoke API key." }, { status: 500 });
  return NextResponse.json({ revoked: true });
}
