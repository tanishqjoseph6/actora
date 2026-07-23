/**
 * Client-safe Gmail message DTOs.
 * Keep googleapis / Node APIs out of this file — Client Components import from here.
 */

export type InboxEmail = {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  date: string;
  unread: boolean;
  starred: boolean;
  priority?: "high" | "medium" | "low";
  labels?: string[];
  hasAttachments?: boolean;
};

export type EmailAttachment = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
};

export type ThreadMessage = {
  id: string;
  sender: string;
  date: string;
  body: string;
  preview: string;
  isCurrent: boolean;
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
  /** Prior messages in this thread for AI context (excludes current message). */
  threadContext: string;
  threadMessages: ThreadMessage[];
  attachments: EmailAttachment[];
  labels: string[];
  starred: boolean;
};
