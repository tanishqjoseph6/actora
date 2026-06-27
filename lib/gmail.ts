import { google } from "googleapis";

export type InboxEmail = {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  date: string;
  unread: boolean;
  starred: boolean;
};

const INBOX_BATCH_SIZE = 20;

export function parseSender(from: string): string {
  const trimmed = from.trim();
  const nameMatch = trimmed.match(/^"?([^"<]+)"?\s*<[^>]+>$/);
  if (nameMatch?.[1]) {
    return nameMatch[1].trim();
  }
  const emailMatch = trimmed.match(/<([^>]+)>/);
  return emailMatch?.[1] ?? trimmed;
}

export function formatEmailDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getHeader(
  headers: { name?: string | null; value?: string | null }[],
  name: string
): string {
  return (
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ??
    ""
  );
}

type GmailAuth = NonNullable<NonNullable<Parameters<typeof google.gmail>[0]>["auth"]>;

export async function fetchInboxEmails(
  auth: GmailAuth,
  maxResults = INBOX_BATCH_SIZE
): Promise<InboxEmail[]> {
  const gmail = google.gmail({ version: "v1", auth });

  const listResponse = await gmail.users.messages.list({
    userId: "me",
    labelIds: ["INBOX"],
    maxResults,
  });

  const messageIds = listResponse.data.messages ?? [];
  if (messageIds.length === 0) {
    return [];
  }

  const emails = await Promise.all(
    messageIds.map(async (message) => {
      if (!message.id) return null;

      const detail = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date"],
      });

      const headers = detail.data.payload?.headers ?? [];
      const dateHeader = getHeader(headers, "Date");

      return {
        id: detail.data.id!,
        sender: parseSender(getHeader(headers, "From")),
        subject: getHeader(headers, "Subject") || "(No subject)",
        preview: detail.data.snippet ?? "",
        date: formatEmailDate(dateHeader),
        unread: detail.data.labelIds?.includes("UNREAD") ?? false,
        starred: detail.data.labelIds?.includes("STARRED") ?? false,
      } satisfies InboxEmail;
    })
  );

  return emails.filter((email): email is InboxEmail => email !== null);
}
