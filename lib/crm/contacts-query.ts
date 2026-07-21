import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CONTACT_SELECT,
  CONTACT_SELECT_BASE,
  isMissingCrmColumnError,
  normalizeCrmContact,
  type CrmContact,
} from "./entities-live";

type ContactRow = Parameters<typeof normalizeCrmContact>[0];

export function mapCrmContacts(rows: ContactRow[] | null | undefined): CrmContact[] {
  const contacts: CrmContact[] = [];
  for (const row of rows ?? []) {
    const contact = normalizeCrmContact(row);
    if (contact) contacts.push(contact);
  }
  return contacts;
}

export async function listContactsForUser(
  db: SupabaseClient,
  userId: string
): Promise<{ contacts: CrmContact[]; error: { message: string } | null }> {
  const full = await db
    .from("crm_contacts")
    .select(CONTACT_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!full.error) {
    return { contacts: mapCrmContacts(full.data as ContactRow[]), error: null };
  }

  if (!isMissingCrmColumnError(full.error.message)) {
    return { contacts: [], error: full.error };
  }

  const base = await db
    .from("crm_contacts")
    .select(CONTACT_SELECT_BASE)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (base.error) {
    return { contacts: [], error: base.error };
  }

  return { contacts: mapCrmContacts(base.data as ContactRow[]), error: null };
}

export async function fetchContactForUser(
  db: SupabaseClient,
  userId: string,
  contactId: string
): Promise<{ contact: CrmContact | null; error: { message: string } | null }> {
  const full = await db
    .from("crm_contacts")
    .select(CONTACT_SELECT)
    .eq("id", contactId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!full.error) {
    return {
      contact: full.data ? normalizeCrmContact(full.data as ContactRow) : null,
      error: null,
    };
  }

  if (!isMissingCrmColumnError(full.error.message)) {
    return { contact: null, error: full.error };
  }

  const base = await db
    .from("crm_contacts")
    .select(CONTACT_SELECT_BASE)
    .eq("id", contactId)
    .eq("user_id", userId)
    .maybeSingle();

  if (base.error) {
    return { contact: null, error: base.error };
  }

  return {
    contact: base.data ? normalizeCrmContact(base.data as ContactRow) : null,
    error: null,
  };
}
