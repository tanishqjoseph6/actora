import { notFound } from "next/navigation";
import { ContactProfileView } from "@/components/crm/ContactProfileView";
import { getApiUserEmail } from "@/lib/auth/get-api-user";
import { fetchContactForUser } from "@/lib/crm/contacts-query";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export default async function ContactProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getApiUserEmail();
  if (!userId) notFound();

  const { id } = await params;
  const db = getSupabaseAdmin();
  if (!db) notFound();

  let contact;
  try {
    const result = await fetchContactForUser(db, userId, id);
    if (result.error) {
      console.error("[crm/contacts/[id]/page]", {
        userId,
        contactId: id,
        error: result.error.message,
      });
      notFound();
    }
    contact = result.contact;
  } catch (error) {
    console.error("[crm/contacts/[id]/page] unexpected error:", {
      userId,
      contactId: id,
      error,
    });
    notFound();
  }

  if (!contact) notFound();

  return <ContactProfileView contact={contact} />;
}
