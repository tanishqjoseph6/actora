import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import {
  clearAllNotifications,
  createUserNotification,
  listUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/repository";
import type { NotificationCategory } from "@/lib/notifications/types";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  return email ? normalizeSubscriptionUserId(email) : null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const notifications = await listUserNotifications(userId);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = (await request.json()) as {
    id?: string;
    read?: boolean;
    all?: boolean;
  };

  if (body.all) {
    const updated = await markAllNotificationsRead(userId);
    const notifications = await listUserNotifications(userId);
    return NextResponse.json({
      updated,
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    });
  }

  if (!body.id || typeof body.read !== "boolean") {
    return NextResponse.json(
      { error: "Notification id and read state are required." },
      { status: 400 }
    );
  }

  const notification = await markNotificationRead(userId, body.id, body.read);
  if (!notification) {
    return NextResponse.json({ error: "Notification not found." }, { status: 404 });
  }

  const notifications = await listUserNotifications(userId);
  return NextResponse.json({
    notification,
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
  });
}

export async function DELETE() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const removed = await clearAllNotifications(userId);
  return NextResponse.json({ removed, notifications: [], unreadCount: 0 });
}

/** Dev-only seed helper — POST creates a sample notification for testing. */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed." }, { status: 405 });
  }

  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = (await request.json()) as {
    category?: NotificationCategory;
    title?: string;
    body?: string;
    href?: string;
  };

  const notification = await createUserNotification(userId, {
    category: body.category ?? "Gmail",
    title: body.title ?? "Sample notification",
    body: body.body ?? "This is a test notification.",
    href: body.href,
  });

  if (!notification) {
    return NextResponse.json(
      { error: "Could not create notification." },
      { status: 500 }
    );
  }

  const notifications = await listUserNotifications(userId);
  return NextResponse.json({
    notification,
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
  });
}
