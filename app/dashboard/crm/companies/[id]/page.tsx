"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { CompanyProfileView } from "@/components/crm/CompanyProfileView";
import { normalizeCrmContact, type CrmContact } from "@/lib/crm/live";
import type { Company } from "@/lib/crm/types";

export default function CompanyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      setLoading(true);
      const res = await fetch(`/api/crm/companies/${id}`);
      if (!res.ok) {
        setCompany(null);
        setLoading(false);
        return;
      }
      const json = (await res.json()) as {
        company?: Company;
        contacts?: Parameters<typeof normalizeCrmContact>[0][];
      };
      if (json.company) {
        setCompany(json.company);
      }
      setContacts(
        (json.contacts ?? []).map((row) => normalizeCrmContact(row))
      );
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-white/5 rounded-lg" />
        <div className="h-32 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  if (!company) notFound();

  const profileContacts = contacts.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    title: c.title,
    companyId: c.companyId ?? company.id,
    companyName: c.companyName,
    owner: c.owner,
    status: c.status,
    tags: [] as string[],
    lastContacted: c.updatedAt,
    linkedin: "",
    notes: "",
    aiLeadScore: c.aiLeadScore,
  }));

  return <CompanyProfileView company={company} contacts={profileContacts} />;
}
