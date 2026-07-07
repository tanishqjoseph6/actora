"use client";

import { useEffect, useMemo, useState } from "react";
import { CrmPageHeader } from "@/components/crm/CrmPageHeader";
import { CrmStatCard } from "@/components/crm/CrmStatCard";
import { CrmSubNav } from "@/components/crm/CrmSubNav";
import { PipelineBoard } from "@/components/crm/pipeline/PipelineBoard";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import type { CrmContact } from "@/lib/crm/live";

export default function PipelinePage() {
  const [contacts, setContacts] = useState<CrmContact[]>([]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/crm/contacts");
      const json = (await res.json()) as { contacts?: CrmContact[] };
      setContacts(json.contacts ?? []);
    })();
  }, []);

  const stats = useMemo(() => {
    const leads = contacts.filter((c) => c.status === "lead").length;
    const active = contacts.filter((c) => c.status === "active").length;
    const inactive = contacts.filter((c) => c.status === "inactive").length;
    const avgScore =
      contacts.length > 0
        ? Math.round(contacts.reduce((sum, c) => sum + c.aiLeadScore, 0) / contacts.length)
        : 0;
    return { leads, active, inactive, avgScore };
  }, [contacts]);

  return (
    <FeatureGate feature="full_crm" fullPage>
      <>
        <CrmPageHeader
          badge="CRM · Pipeline"
          title="Lead"
          titleAccent="Pipeline"
          description="Drag contacts across stages and keep your pipeline current."
        />

        <div className="mb-6">
          <CrmSubNav />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
          <CrmStatCard title="Total contacts" value={contacts.length} />
          <CrmStatCard title="Leads" value={stats.leads} />
          <CrmStatCard title="Active" value={stats.active} />
          <CrmStatCard title="Avg. AI score" value={stats.avgScore} />
        </div>

        <div className="rounded-xl border border-[#1E293B] bg-[#111827] p-4 sm:p-6 lg:p-8">
          <PipelineBoard />
        </div>
      </>
    </FeatureGate>
  );
}
