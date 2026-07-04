"use client";

import { useEffect, useMemo, useState } from "react";
import { ContactListItem } from "@/components/crm/ContactListItem";
import { CrmEmptyState, ContactEmptyIcon } from "@/components/crm/CrmEmptyState";
import { CrmFilterChips } from "@/components/crm/CrmFilterChips";
import { CrmListSkeleton } from "@/components/crm/CrmListSkeleton";
import { CrmPageHeader } from "@/components/crm/CrmPageHeader";
import { CrmSearchInput } from "@/components/crm/CrmSearchInput";
import { CrmSelectFilter } from "@/components/crm/CrmSelectFilter";
import { CrmStatCard } from "@/components/crm/CrmStatCard";
import { CrmSubNav } from "@/components/crm/CrmSubNav";
import {
  CRM_OWNERS,
  filterContacts,
  sortContacts,
} from "@/lib/crm/entities";
import { MOCK_COMPANIES, MOCK_CONTACTS } from "@/lib/crm/mock-data";
import type { ContactSort, ContactStatus } from "@/lib/crm/types";

type ContactFilter = "all" | ContactStatus;

export default function ContactsPage() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ContactFilter>("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [sort, setSort] = useState<ContactSort>("name-asc");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const filterCounts = useMemo(() => {
    const counts = { all: MOCK_CONTACTS.length, active: 0, lead: 0, inactive: 0 };
    for (const c of MOCK_CONTACTS) counts[c.status]++;
    return counts;
  }, []);

  const filteredContacts = useMemo(() => {
    const filtered = filterContacts(MOCK_CONTACTS, {
      search: searchQuery,
      status: activeFilter,
      companyId: companyFilter,
      owner: ownerFilter,
    });
    return sortContacts(filtered, sort);
  }, [searchQuery, activeFilter, companyFilter, ownerFilter, sort]);

  const chips = [
    { id: "all", label: "All", count: filterCounts.all },
    { id: "active", label: "Active", count: filterCounts.active },
    { id: "lead", label: "Leads", count: filterCounts.lead },
    { id: "inactive", label: "Inactive", count: filterCounts.inactive },
  ];

  const hasSearch = searchQuery.trim().length > 0;
  const avgAiScore = Math.round(
    MOCK_CONTACTS.reduce((s, c) => s + c.aiLeadScore, 0) / MOCK_CONTACTS.length
  );

  if (loading) {
    return (
      <>
        <CrmPageHeader
          badge="👤 CRM · Contacts"
          title="Your"
          titleAccent="Contacts"
          description="Track relationships, roles, and engagement across every account in your pipeline."
        />
        <div className="mb-6">
          <CrmSubNav />
        </div>
        <CrmListSkeleton rows={6} />
      </>
    );
  }

  return (
    <>
      <CrmPageHeader
        badge="👤 CRM · Contacts"
        title="Your"
        titleAccent="Contacts"
        description="Track relationships, roles, and engagement across every account in your pipeline."
      />

      <div className="mb-6">
        <CrmSubNav />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
        <CrmStatCard title="Total contacts" value={MOCK_CONTACTS.length} />
        <CrmStatCard title="Active" value={filterCounts.active} />
        <CrmStatCard title="Leads" value={filterCounts.lead} />
        <CrmStatCard title="Avg. AI score" value={avgAiScore} />
      </div>

      <div className="bg-[#0B1220]/80 border border-blue-400/20 rounded-3xl p-5 sm:p-6 lg:p-8 backdrop-blur-sm shadow-lg shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold">All contacts</h2>
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8] opacity-60 cursor-not-allowed"
            title="Coming soon"
          >
            + Add contact
          </button>
        </div>

        <div className="mb-4">
          <CrmSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name, email, company, owner, or notes…"
          />
        </div>

        <div className="mb-4">
          <CrmFilterChips
            chips={chips}
            activeId={activeFilter}
            onChange={(id) => setActiveFilter(id as ContactFilter)}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 mb-6">
          <CrmSelectFilter
            label="Company"
            value={companyFilter}
            onChange={setCompanyFilter}
            options={[
              { value: "all", label: "All companies" },
              ...MOCK_COMPANIES.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          <CrmSelectFilter
            label="Owner"
            value={ownerFilter}
            onChange={setOwnerFilter}
            options={CRM_OWNERS.map((o) => ({
              value: o,
              label: o === "all" ? "All owners" : o,
            }))}
          />
          <CrmSelectFilter
            label="Sort"
            value={sort}
            onChange={(v) => setSort(v as ContactSort)}
            options={[
              { value: "name-asc", label: "Name A → Z" },
              { value: "name-desc", label: "Name Z → A" },
              { value: "last-contacted", label: "Last contacted" },
              { value: "ai-score-desc", label: "AI score" },
            ]}
          />
        </div>

        {filteredContacts.length === 0 ? (
          <CrmEmptyState
            icon={<ContactEmptyIcon className="w-8 h-8 text-blue-400/60" />}
            title={
              hasSearch
                ? "No contacts match your search"
                : "No contacts match your filters"
            }
            description="Try a different search term or adjust your filters."
          />
        ) : (
          <div className="space-y-2">
            {filteredContacts.map((contact) => (
              <ContactListItem key={contact.id} contact={contact} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
