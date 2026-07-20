import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ContactProfileView } from "@/components/crm/ContactProfileView";
import { authOptions } from "@/lib/auth/auth-options";
import { normalizeCrmContact, CONTACT_SELECT } from "@/lib/crm/live";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export default async function ContactProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email;
  if (!userId) notFound();

  const { id } = await params;
  const db = getSupabaseAdmin();
  if (!db) notFound();

  const { data } = await db
    .from("crm_contacts")
    .select(CONTACT_SELECT)
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) notFound();

  return <ContactProfileView contact={normalizeCrmContact(data)} />;
}
