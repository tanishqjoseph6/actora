"use client";

import { useMemo, useState } from "react";
import { ContactListItem } from "@/components/crm/ContactListItem";
import { CrmEmptyState, ContactEmptyIcon } from "@/components/crm/CrmEmptyState";
import { CrmFilterChips } from "@/components/crm/CrmFilterChips";
import { CrmPageHeader } from "@/components/crm/CrmPageHeader";
import { CrmSearchInput } from "@/components/crm/CrmSearchInput";
import { CrmStatCard } from "@/components/crm/CrmStatCard";
import { CrmSubNav } from "@/components/crm/CrmSubNav";
import { MOCK_CONTACTS } from "@/lib/crm/mock-data";
import type { ContactStatus } from "@/lib/crm/types";

type ContactFilter = "all" | ContactStatus;

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ContactFilter>("all");

  const filterCounts = useMemo(() => {
    const counts = { all: MOCK_CONTACTS.length, active: 0, lead: 0, inactive: 0 };
    for (const c of MOCK_CONTACTS) counts[c.status]++;
    return counts;
  }, []);

  const filteredContacts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return MOCK_CONTACTS.filter((contact) => {
      if (activeFilter !== "all" && contact.status !== activeFilter) return false;
      if (!query) return true;
      return (
        contact.name.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query) ||
        contact.companyName.toLowerCase().includes(query) ||
        contact.title.toLowerCase().includes(query) ||
        contact.tags.some((t) => t.toLowerCase().includes(query))
      );
    });
  }, [searchQuery, activeFilter]);

  const chips = [
    { id: "all", label: "All", count: filterCounts.all },
    { id: "active", label: "Active", count: filterCounts.active },
    { id: "lead", label: "Leads", count: filterCounts.lead },
    { id: "inactive", label: "Inactive", count: filterCounts.inactive },
  ];

  const hasSearch = searchQuery.trim().length > 0;

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
        <CrmStatCard title="Companies linked" value={new Set(MOCK_CONTACTS.map((c) => c.companyId)).size} />
      </div>

      <div className="bg-[#081226]/80 border border-cyan-400/20 rounded-3xl p-5 sm:p-6 lg:p-8 backdrop-blur-sm shadow-lg shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold">All contacts</h2>
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#3B82F6] to-[#00CFFF] text-[#050816] opacity-60 cursor-not-allowed"
            title="Coming soon"
          >
            + Add contact
          </button>
        </div>

        <div className="mb-4">
          <CrmSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name, email, company, or tag…"
          />
        </div>

        <div className="mb-6">
          <CrmFilterChips
            chips={chips}
            activeId={activeFilter}
            onChange={(id) => setActiveFilter(id as ContactFilter)}
          />
        </div>

        {filteredContacts.length === 0 ? (
          <CrmEmptyState
            icon={<ContactEmptyIcon className="w-8 h-8 text-cyan-400/60" />}
            title={
              hasSearch
                ? "No contacts match your search"
                : `No ${activeFilter === "all" ? "" : activeFilter + " "}contacts found`
            }
            description={
              hasSearch
                ? "Try a different search term or clear your filters."
                : "Adjust your filters to see contacts in this category."
            }
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
