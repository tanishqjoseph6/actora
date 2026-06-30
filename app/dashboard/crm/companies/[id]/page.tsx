import { notFound } from "next/navigation";
import { CompanyProfileView } from "@/components/crm/CompanyProfileView";
import {
  getCompanyById,
  getContactsByCompanyId,
} from "@/lib/crm/entities";

export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = getCompanyById(id);

  if (!company) {
    notFound();
  }

  const contacts = getContactsByCompanyId(id);

  return <CompanyProfileView company={company} contacts={contacts} />;
}
