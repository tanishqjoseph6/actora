import { NextRequest, NextResponse } from "next/server";
import { requireWorkspacePermission, requireWritableWorkspacePermission } from "@/lib/workspace/require";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { releaseWorkspaceFile, STORAGE_BUCKET } from "@/lib/storage/repository";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  const auth = await requireWorkspacePermission("files", request);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Storage unavailable." }, { status: 503 });
  const { data: file } = await db.from("workspace_files").select("id,path,name,mime_type,status")
    .eq("id", id).eq("workspace_id", auth.ctx.workspaceId).is("deleted_at", null).maybeSingle();
  if (!file || file.status !== "ready") return NextResponse.json({ error: "File not found." }, { status: 404 });
  const { data, error } = await db.storage.from(STORAGE_BUCKET).createSignedUrl(file.path, 600);
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Could not create a download link." }, { status: 503 });
  return NextResponse.json({ url: data.signedUrl, name: file.name, mimeType: file.mime_type, expiresIn: 600 });
}

export async function DELETE(request: NextRequest, context: Context) {
  const auth = await requireWritableWorkspacePermission("files", request);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const deleted = await releaseWorkspaceFile(auth.ctx.workspaceId, id, auth.email);
  if (!deleted) return NextResponse.json({ error: "File not found." }, { status: 404 });
  return NextResponse.json({ deleted: true });
}
