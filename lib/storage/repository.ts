import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getStoredSubscription } from "@/lib/subscription/repository";
import { getStorageLimitBytes, formatBytes } from "./limits";

export const STORAGE_BUCKET = "workspace-files";
export const MAX_FILE_BYTES = 500 * 1024 * 1024;

const ALLOWED_MIME_PREFIXES = [
  "image/",
  "text/",
  "audio/",
  "video/",
  "application/pdf",
  "application/json",
  "application/zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.",
];

export function sanitizeFileName(value: string) {
  const normalized = value.normalize("NFKC").replace(/[/\\\0]/g, "-").replace(/[^\w.\- ()[\]]/g, "_");
  return normalized.trim().slice(0, 180) || "untitled-file";
}

export function isAllowedMimeType(mimeType: string) {
  return ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
}

export async function getWorkspaceStorageSnapshot(workspaceId: string, userId: string) {
  const db = getSupabaseAdmin();
  const subscription = await getStoredSubscription(userId);
  const limitBytes = getStorageLimitBytes(subscription?.planId ?? "free");
  if (!db) return { usedBytes: 0, reservedBytes: 0, fileCount: 0, limitBytes };
  const { data } = await db.from("workspace_storage_usage")
    .select("used_bytes,reserved_bytes,file_count")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  return {
    usedBytes: Number(data?.used_bytes ?? 0),
    reservedBytes: Number(data?.reserved_bytes ?? 0),
    fileCount: Number(data?.file_count ?? 0),
    limitBytes,
  };
}

export async function reserveWorkspaceFile({
  workspaceId,
  userId,
  name,
  mimeType,
  sizeBytes,
  folderPath,
}: {
  workspaceId: string;
  userId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  folderPath: string;
}) {
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_FILE_BYTES) {
    throw new Error(`Files must be between 1 byte and ${formatBytes(MAX_FILE_BYTES)}.`);
  }
  if (!isAllowedMimeType(mimeType)) throw new Error("This file type is not supported.");
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Storage is temporarily unavailable.");
  const subscription = await getStoredSubscription(userId);
  const limitBytes = getStorageLimitBytes(subscription?.planId ?? "free");
  const { data: quota, error: quotaError } = await db.rpc("reserve_workspace_storage", {
    p_workspace_id: workspaceId,
    p_bytes: sizeBytes,
    p_limit_bytes: Number.isFinite(limitBytes) ? limitBytes : -1,
  });
  if (quotaError) throw new Error("Storage quota is temporarily unavailable.");
  if (!quota?.[0]?.allowed) {
    const error = new Error("Storage limit reached. Upgrade your plan to upload more files.");
    error.name = "STORAGE_LIMIT_REACHED";
    throw error;
  }

  const id = crypto.randomUUID();
  const safeName = sanitizeFileName(name);
  const path = `${workspaceId}/${id}/${safeName}`;
  const { error: insertError } = await db.from("workspace_files").insert({
    id,
    workspace_id: workspaceId,
    uploaded_by: userId,
    name: safeName,
    path,
    folder_path: folderPath.startsWith("/") ? folderPath : `/${folderPath}`,
    mime_type: mimeType,
    size_bytes: sizeBytes,
    status: "pending",
  });
  if (insertError) {
    await db.rpc("release_workspace_storage_reservation", { p_workspace_id: workspaceId, p_bytes: sizeBytes });
    throw new Error("Could not create the file record.");
  }
  const { data: signed, error: signedError } = await db.storage.from(STORAGE_BUCKET).createSignedUploadUrl(path);
  if (signedError || !signed) {
    await db.from("workspace_files").delete().eq("id", id);
    await db.rpc("release_workspace_storage_reservation", { p_workspace_id: workspaceId, p_bytes: sizeBytes });
    throw new Error("Could not initialize the upload.");
  }
  return { id, path, token: signed.token, uploadUrl: signed.signedUrl, sizeBytes, limitBytes };
}

export async function finalizeWorkspaceFile(workspaceId: string, fileId: string, actualSize: number, checksum?: string) {
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Storage is temporarily unavailable.");
  const { data: file } = await db.from("workspace_files")
    .select("id,path,size_bytes,status")
    .eq("id", fileId).eq("workspace_id", workspaceId).is("deleted_at", null).maybeSingle();
  if (!file || file.status !== "pending") throw new Error("Upload is no longer pending.");
  if (!Number.isSafeInteger(actualSize) || actualSize <= 0 || actualSize > Number(file.size_bytes)) {
    throw new Error("Uploaded file size does not match the reservation.");
  }
  const { data: stored } = await db.storage.from(STORAGE_BUCKET).list(`${workspaceId}/${fileId}`);
  if (!stored?.some((entry) => entry.name && file.path.endsWith(`/${entry.name}`))) {
    throw new Error("Uploaded object was not found.");
  }
  const { error } = await db.from("workspace_files").update({
    size_bytes: actualSize,
    checksum: checksum?.slice(0, 128) ?? null,
    status: "ready",
    updated_at: new Date().toISOString(),
  }).eq("id", fileId).eq("workspace_id", workspaceId);
  if (error) throw new Error("Could not finalize the file.");
  await db.rpc("finalize_workspace_storage", {
    p_workspace_id: workspaceId,
    p_reserved_bytes: Number(file.size_bytes),
    p_actual_bytes: actualSize,
    p_file_delta: 1,
  });
  await db.from("workspace_storage_audit").insert({
    workspace_id: workspaceId, file_id: fileId, actor_user_id: null, action: "file.uploaded", bytes: actualSize,
  });
  return { id: fileId, status: "ready", sizeBytes: actualSize };
}

export async function releaseWorkspaceFile(workspaceId: string, fileId: string, userId: string) {
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Storage is temporarily unavailable.");
  const { data: file } = await db.from("workspace_files")
    .select("id,path,size_bytes,status").eq("id", fileId).eq("workspace_id", workspaceId).is("deleted_at", null).maybeSingle();
  if (!file) return false;
  await db.storage.from(STORAGE_BUCKET).remove([file.path]);
  if (file.status === "pending") {
    await db.rpc("release_workspace_storage_reservation", { p_workspace_id: workspaceId, p_bytes: Number(file.size_bytes) });
  } else if (file.status === "ready") {
    await db.rpc("release_workspace_storage", { p_workspace_id: workspaceId, p_bytes: Number(file.size_bytes), p_file_delta: 1 });
  }
  await db.from("workspace_files").update({ status: "deleted", deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", fileId).eq("workspace_id", workspaceId);
  await db.from("workspace_storage_audit").insert({
    workspace_id: workspaceId, file_id: fileId, actor_user_id: userId, action: "file.deleted", bytes: Number(file.size_bytes),
  });
  return true;
}
