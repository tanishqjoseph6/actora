import { NextRequest, NextResponse } from "next/server";
import { requireWorkspacePermission } from "@/lib/workspace/require";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getWorkspaceStorageSnapshot } from "@/lib/storage/repository";

export async function GET(request: NextRequest) {
  const auth = await requireWorkspacePermission("files", request);
  if (!auth.ok) return auth.response;
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Storage unavailable." }, { status: 503 });
  const search = request.nextUrl.searchParams.get("search")?.trim() ?? "";
  const folder = request.nextUrl.searchParams.get("folder")?.trim() ?? "/";
  let query = db.from("workspace_files")
    .select("id,name,folder_path,mime_type,size_bytes,status,visibility,uploaded_by,created_at,updated_at")
    .eq("workspace_id", auth.ctx.workspaceId).is("deleted_at", null)
    .order("created_at", { ascending: false }).limit(500);
  if (folder) query = query.eq("folder_path", folder.startsWith("/") ? folder : `/${folder}`);
  if (search) query = query.ilike("name", `%${search.replace(/[%_]/g, "")}%`);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Could not load files." }, { status: 500 });
  const usage = await getWorkspaceStorageSnapshot(auth.ctx.workspaceId, auth.email);
  return NextResponse.json({ files: data ?? [], usage });
}
