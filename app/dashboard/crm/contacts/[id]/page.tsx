import { notFound } from "next/navigation";
import { ContactProfileView } from "@/components/crm/ContactProfileView";
import {
  getCompanyForContact,
  getContactById,
} from "@/lib/crm/entities";

export default async function ContactProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = getContactById(id);

  if (!contact) {
    notFound();
  }

  const company = getCompanyForContact(contact);

  return <ContactProfileView contact={contact} company={company} />;
}
