import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ContactProfileView } from "@/components/crm/ContactProfileView";
import { authOptions } from "@/lib/auth/auth-options";
import { fetchContactForUser } from "@/lib/crm/contacts-query";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export default async function ContactProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email
    ? normalizeSubscriptionUserId(session.user.email)
    : null;
  if (!userId) notFound();

  const { id } = await params;
  const db = getSupabaseAdmin();
  if (!db) notFound();

  try {
    const { contact, error } = await fetchContactForUser(db, userId, id);
    if (error) {
      console.error("[crm/contacts/[id]/page]", {
        userId,
        contactId: id,
        error: error.message,
      });
      notFound();
    }
    if (!contact) notFound();

    return <ContactProfileView contact={contact} />;
  } catch (error) {
    console.error("[crm/contacts/[id]/page] unexpected error:", {
      userId,
      contactId: id,
      error,
    });
    notFound();
  }
}
