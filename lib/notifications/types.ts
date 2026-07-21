export type NotificationCategory =
  | "Gmail"
  | "CRM"
  | "Calendar"
  | "Automations"
  | "Roxx"
  | "Product Updates"
  | "Billing Updates";

export type UserNotification = {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt: string;
};

export type UserNotificationRow = {
  id: string;
  user_id: string;
  category: string;
  title: string;
  body: string;
  href: string;
  read: boolean;
  created_at: string;
};

export const NOTIFICATION_CATEGORY_HREF: Record<NotificationCategory, string> = {
  Gmail: "/dashboard/inbox",
  CRM: "/dashboard/crm",
  Calendar: "/dashboard/calendar",
  Automations: "/dashboard/automations",
  Roxx: "/dashboard",
  "Product Updates": "/dashboard/settings",
  "Billing Updates": "/billing",
};

export function normalizeNotificationCategory(
  value: string | null | undefined
): NotificationCategory {
  // Legacy label from before the Roxx rename
  if (value === "AI Assistant") return "Roxx";

  const categories: NotificationCategory[] = [
    "Gmail",
    "CRM",
    "Calendar",
    "Automations",
    "Roxx",
    "Product Updates",
    "Billing Updates",
  ];
  if (value && categories.includes(value as NotificationCategory)) {
    return value as NotificationCategory;
  }
  return "Gmail";
}

export function mapNotificationRow(row: UserNotificationRow): UserNotification {
  const category = normalizeNotificationCategory(row.category);
  return {
    id: row.id,
    category,
    title: row.title,
    body: row.body ?? "",
    href: row.href || NOTIFICATION_CATEGORY_HREF[category],
    read: Boolean(row.read),
    createdAt: row.created_at,
  };
}
