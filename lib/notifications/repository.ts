import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  mapNotificationRow,
  type NotificationCategory,
  type UserNotification,
  type UserNotificationRow,
} from "./types";

const SELECT =
  "id, user_id, category, title, body, href, read, created_at";

export async function listUserNotifications(
  userId: string,
  limit = 50
): Promise<UserNotification[]> {
  const db = getSupabaseAdmin();
  if (!db) return [];

  const { data, error } = await db
    .from("user_notifications")
    .select(SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[notifications] list failed:", error.message);
    return [];
  }

  return (data as UserNotificationRow[]).map(mapNotificationRow);
}

export async function markNotificationRead(
  userId: string,
  id: string,
  read: boolean
): Promise<UserNotification | null> {
  const db = getSupabaseAdmin();
  if (!db) return null;

  const { data, error } = await db
    .from("user_notifications")
    .update({ read })
    .eq("user_id", userId)
    .eq("id", id)
    .select(SELECT)
    .maybeSingle();

  if (error || !data) return null;
  return mapNotificationRow(data as UserNotificationRow);
}

export async function markAllNotificationsRead(
  userId: string
): Promise<number> {
  const db = getSupabaseAdmin();
  if (!db) return 0;

  const { data, error } = await db
    .from("user_notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false)
    .select("id");

  if (error) {
    console.error("[notifications] mark all read failed:", error.message);
    return 0;
  }

  return data?.length ?? 0;
}

export async function clearAllNotifications(userId: string): Promise<number> {
  const db = getSupabaseAdmin();
  if (!db) return 0;

  const { data, error } = await db
    .from("user_notifications")
    .delete()
    .eq("user_id", userId)
    .select("id");

  if (error) {
    console.error("[notifications] clear all failed:", error.message);
    return 0;
  }

  return data?.length ?? 0;
}

export async function createUserNotification(
  userId: string,
  input: {
    category: NotificationCategory;
    title: string;
    body?: string;
    href?: string;
  }
): Promise<UserNotification | null> {
  const db = getSupabaseAdmin();
  if (!db) return null;

  const { data, error } = await db
    .from("user_notifications")
    .insert({
      user_id: userId,
      category: input.category,
      title: input.title,
      body: input.body ?? "",
      href: input.href ?? "/dashboard",
    })
    .select(SELECT)
    .single();

  if (error || !data) return null;
  return mapNotificationRow(data as UserNotificationRow);
}
