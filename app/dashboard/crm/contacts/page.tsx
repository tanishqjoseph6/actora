"use client";

import { useEffect, useMemo, useState } from "react";
import { ContactsTable, ContactsTableSkeleton } from "@/components/crm/contacts/ContactsTable";
import { ContactListItem } from "@/components/crm/ContactListItem";
import { CrmEmptyState, ContactEmptyIcon } from "@/components/crm/CrmEmptyState";
import { CrmFilterChips } from "@/components/crm/CrmFilterChips";
import { CrmPageHeader } from "@/components/crm/CrmPageHeader";
import { CrmPagination } from "@/components/crm/CrmPagination";
import { CrmSearchInput } from "@/components/crm/CrmSearchInput";
import { CrmSelectFilter } from "@/components/crm/CrmSelectFilter";
import { CrmStatCard } from "@/components/crm/CrmStatCard";
import { CrmSubNav } from "@/components/crm/CrmSubNav";
import { Skeleton } from "@/components/ui/Skeleton";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import {
  CRM_OWNERS,
  filterContacts,
  sortContacts,
} from "@/lib/crm/entities";
import { MOCK_COMPANIES, MOCK_CONTACTS } from "@/lib/crm/mock-data";
import type { ContactSort, ContactStatus } from "@/lib/crm/types";

type ContactFilter = "all" | ContactStatus;

const PAGE_SIZE_DEFAULT = 10;

export default function ContactsPage() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ContactFilter>("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [sort, setSort] = useState<ContactSort>("name-asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

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

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedContacts = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredContacts.slice(start, start + pageSize);
  }, [filteredContacts, safePage, pageSize]);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#1E293B] bg-[#111827] p-4 sm:p-5 space-y-3"
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[#1E293B] bg-[#111827] p-5 sm:p-6">
          <ContactsTableSkeleton />
        </div>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
        <CrmStatCard title="Total contacts" value={MOCK_CONTACTS.length} />
        <CrmStatCard title="Active" value={filterCounts.active} />
        <CrmStatCard title="Leads" value={filterCounts.lead} />
        <CrmStatCard title="Avg. AI score" value={avgAiScore} />
      </div>

      <div className={dashboard.panelLg}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">All contacts</h2>
            <p className="text-sm text-[#64748B] mt-0.5 tabular-nums">
              {filteredContacts.length} contact{filteredContacts.length !== 1 ? "s" : ""}
              {filteredContacts.length !== MOCK_CONTACTS.length &&
                ` · filtered from ${MOCK_CONTACTS.length}`}
            </p>
          </div>
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-[#2563EB] text-white opacity-60 cursor-not-allowed shrink-0"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
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
            icon={<ContactEmptyIcon className="w-8 h-8 text-[#64748B]" />}
            title={
              hasSearch
                ? "No contacts match your search"
                : "No contacts match your filters"
            }
            description="Try a different search term or adjust your filters."
          />
        ) : (
          <>
            <div className="lg:hidden space-y-2 mb-4">
              {paginatedContacts.map((contact) => (
                <ContactListItem key={contact.id} contact={contact} />
              ))}
            </div>
            <div className="hidden lg:block">
              <ContactsTable contacts={paginatedContacts} />
            </div>
            <CrmPagination
              page={safePage}
              pageSize={pageSize}
              totalItems={filteredContacts.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </div>
    </>
  );
}
