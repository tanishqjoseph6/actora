import type { InboxEmail } from "@/lib/gmail";

export type SnoozeEntry = {
  emailId: string;
  wakeAt: string;
  email: InboxEmail;
  accountEmail?: string;
};

const STORAGE_KEY = "actora_inbox_snoozed_v1";

function readStore(): SnoozeEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SnoozeEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStore(entries: SnoozeEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function listSnoozedEmails(accountEmail?: string | null): SnoozeEntry[] {
  const now = Date.now();
  return readStore().filter((entry) => {
    if (accountEmail && entry.accountEmail && entry.accountEmail !== accountEmail) {
      return false;
    }
    return new Date(entry.wakeAt).getTime() > now;
  });
}

export function listReadySnoozes(accountEmail?: string | null): SnoozeEntry[] {
  const now = Date.now();
  return readStore().filter((entry) => {
    if (accountEmail && entry.accountEmail && entry.accountEmail !== accountEmail) {
      return false;
    }
    return new Date(entry.wakeAt).getTime() <= now;
  });
}

export function snoozeEmail(
  email: InboxEmail,
  wakeAt: Date,
  accountEmail?: string | null
) {
  const entries = readStore().filter((e) => e.emailId !== email.id);
  entries.unshift({
    emailId: email.id,
    wakeAt: wakeAt.toISOString(),
    email,
    accountEmail: accountEmail ?? undefined,
  });
  writeStore(entries);
}

export function unsnoozeEmail(emailId: string) {
  writeStore(readStore().filter((e) => e.emailId !== emailId));
}

export function isEmailSnoozed(emailId: string): boolean {
  return listSnoozedEmails().some((e) => e.emailId === emailId);
}

export const SNOOZE_OPTIONS = [
  { label: "Later today", hours: 3 },
  { label: "Tomorrow", hours: 24 },
  { label: "Next week", hours: 24 * 7 },
] as const;
