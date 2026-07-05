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

export type EmailDetail = {
  id: string;
  threadId: string;
  sender: string;
  senderEmail: string;
  subject: string;
  body: string;
  date: string;
  messageIdHeader: string;
  /** Prior messages in the thread for AI context (excludes current message). */
  threadContext: string;
};

const INBOX_BATCH_SIZE = 20;

export function parseSenderEmail(from: string): string {
  const emailMatch = from.match(/<([^>]+)>/);
  return emailMatch?.[1] ?? from.trim();
}

export function formatReplySubject(subject: string): string {
  const trimmed = subject.trim();
  if (/^re:/i.test(trimmed)) {
    return trimmed;
  }
  return `Re: ${trimmed}`;
}

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf-8");
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractBodyFromPart(
  part: { mimeType?: string | null; body?: { data?: string | null } | null; parts?: unknown[] | null }
): string {
  if (part.body?.data) {
    const decoded = decodeBase64Url(part.body.data);
    if (part.mimeType === "text/html") {
      return stripHtml(decoded);
    }
    return decoded;
  }

  if (part.parts?.length) {
    const parts = part.parts as typeof part[];

    const plain = parts.find((p) => p.mimeType === "text/plain");
    if (plain) {
      const body = extractBodyFromPart(plain);
      if (body) return body;
    }

    const html = parts.find((p) => p.mimeType === "text/html");
    if (html) {
      const body = extractBodyFromPart(html);
      if (body) return body;
    }

    for (const nested of parts) {
      const body = extractBodyFromPart(nested);
      if (body) return body;
    }
  }

  return "";
}

function buildMimeMessage({
  to,
  subject,
  body,
  htmlBody,
  inReplyTo,
  references,
}: {
  to: string;
  subject: string;
  body: string;
  htmlBody?: string;
  inReplyTo?: string;
  references?: string;
}): string {
  const baseHeaders = [`To: ${to}`, `Subject: ${subject}`, "MIME-Version: 1.0"];

  if (inReplyTo) baseHeaders.push(`In-Reply-To: ${inReplyTo}`);
  if (references) baseHeaders.push(`References: ${references}`);

  if (htmlBody) {
    const boundary = `actora_${Date.now()}`;
    return [
      ...baseHeaders,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      "Content-Type: text/plain; charset=utf-8",
      "Content-Transfer-Encoding: 7bit",
      "",
      body,
      `--${boundary}`,
      "Content-Type: text/html; charset=utf-8",
      "Content-Transfer-Encoding: 7bit",
      "",
      htmlBody,
      `--${boundary}--`,
    ].join("\r\n");
  }

  return [
    ...baseHeaders,
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    body,
  ].join("\r\n");
}

function encodeMimeForGmail(raw: string): string {
  return Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

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

const THREAD_CONTEXT_MAX_MESSAGES = 4;
const THREAD_CONTEXT_BODY_LIMIT = 1500;

async function fetchThreadContext(
  gmail: ReturnType<typeof google.gmail>,
  threadId: string,
  currentMessageId: string
): Promise<string> {
  const thread = await gmail.users.threads.get({
    userId: "me",
    id: threadId,
    format: "full",
  });

  const messages = thread.data.messages ?? [];
  if (messages.length <= 1) return "";

  const priorMessages = messages
    .filter((msg) => msg.id && msg.id !== currentMessageId)
    .slice(-THREAD_CONTEXT_MAX_MESSAGES);

  if (priorMessages.length === 0) return "";

  return priorMessages
    .map((msg) => {
      const headers = msg.payload?.headers ?? [];
      const from = parseSender(getHeader(headers, "From"));
      const date = formatEmailDate(getHeader(headers, "Date"));
      const snippet =
        extractBodyFromPart(msg.payload ?? {}) || msg.snippet || "";
      return `[${date}] From ${from}:\n${snippet.slice(0, THREAD_CONTEXT_BODY_LIMIT)}`;
    })
    .join("\n\n---\n\n");
}

export async function fetchEmailById(
  auth: GmailAuth,
  messageId: string
): Promise<EmailDetail | null> {
  const gmail = google.gmail({ version: "v1", auth });

  const detail = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  if (!detail.data.id || !detail.data.threadId) {
    return null;
  }

  const headers = detail.data.payload?.headers ?? [];
  const fromHeader = getHeader(headers, "From");
  const dateHeader = getHeader(headers, "Date");
  const body =
    extractBodyFromPart(detail.data.payload ?? {}) ||
    detail.data.snippet ||
    "";

  const threadContext = await fetchThreadContext(
    gmail,
    detail.data.threadId,
    detail.data.id
  );

  return {
    id: detail.data.id,
    threadId: detail.data.threadId,
    sender: parseSender(fromHeader),
    senderEmail: parseSenderEmail(fromHeader),
    subject: getHeader(headers, "Subject") || "(No subject)",
    body,
    date: formatEmailDate(dateHeader),
    messageIdHeader: getHeader(headers, "Message-ID"),
    threadContext,
  };
}

export async function sendEmailReply(
  auth: GmailAuth,
  {
    threadId,
    to,
    subject,
    body,
    htmlBody,
    inReplyTo,
    references,
  }: {
    threadId: string;
    to: string;
    subject: string;
    body: string;
    htmlBody?: string;
    inReplyTo?: string;
    references?: string;
  }
): Promise<{ id: string }> {
  const gmail = google.gmail({ version: "v1", auth });

  const raw = buildMimeMessage({
    to,
    subject,
    body,
    htmlBody,
    inReplyTo,
    references,
  });

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodeMimeForGmail(raw),
      threadId,
    },
  });

  if (!response.data.id) {
    throw new Error("Gmail did not return a message id.");
  }

  return { id: response.data.id };
}

export async function markEmailAsRead(
  auth: GmailAuth,
  messageId: string
): Promise<void> {
  const gmail = google.gmail({ version: "v1", auth });

  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      removeLabelIds: ["UNREAD"],
    },
  });
}

export async function archiveEmail(
  auth: GmailAuth,
  messageId: string
): Promise<void> {
  const gmail = google.gmail({ version: "v1", auth });

  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      removeLabelIds: ["INBOX"],
    },
  });
}
