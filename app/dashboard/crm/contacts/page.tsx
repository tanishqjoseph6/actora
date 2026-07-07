"use client";

import { useEffect, useMemo, useState } from "react";
import { ContactsTable, ContactsTableSkeleton } from "@/components/crm/contacts/ContactsTable";
import { ContactListItem } from "@/components/crm/ContactListItem";
import { CrmEmptyState } from "@/components/crm/CrmEmptyState";
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
  filterAndSortContacts,
  type CrmContact,
  type CrmContactInput,
  type CrmContactSort,
  type CrmContactStatus,
} from "@/lib/crm/live";

type ContactFilter = "all" | CrmContactStatus;

const PAGE_SIZE_DEFAULT = 10;

export default function ContactsPage() {
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CrmContact | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ContactFilter>("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [sort, setSort] = useState<CrmContactSort>("name-asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
  const [form, setForm] = useState<CrmContactInput>({
    name: "",
    email: "",
    companyName: "",
    status: "lead",
    aiLeadScore: 0,
  });

  useEffect(() => {
    void loadContacts();
  }, []);

  async function loadContacts() {
    setLoading(true);
    try {
      const res = await fetch("/api/crm/contacts");
      const json = (await res.json()) as { contacts?: CrmContact[] };
      setContacts(json.contacts ?? []);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({
      name: "",
      email: "",
      companyName: "",
      status: "lead",
      aiLeadScore: 0,
    });
    setShowForm(true);
  }

  function openEdit(contact: {
    id: string;
    name: string;
    email: string;
    companyName: string;
    status: CrmContactStatus;
    aiLeadScore: number;
  }) {
    const full = contacts.find((c) => c.id === contact.id);
    if (!full) return;
    setEditing(full);
    setForm({
      name: full.name,
      email: full.email,
      companyName: full.companyName,
      status: full.status,
      aiLeadScore: full.aiLeadScore,
    });
    setShowForm(true);
  }

  async function saveContact() {
    if (!form.name?.trim()) return;
    setSaving(true);
    const url = editing ? `/api/crm/contacts/${editing.id}` : "/api/crm/contacts";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) return;
    setShowForm(false);
    await loadContacts();
  }

  async function deleteContact(contact: { id: string; name: string }) {
    const confirmed = window.confirm(`Delete ${contact.name}?`);
    if (!confirmed) return;
    await fetch(`/api/crm/contacts/${contact.id}`, { method: "DELETE" });
    await loadContacts();
  }

  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeFilter, companyFilter, sort]);

  const companies = useMemo(
    () => Array.from(new Set(contacts.map((c) => c.companyName).filter(Boolean))).sort(),
    [contacts]
  );

  const filterCounts = useMemo(() => {
    const counts = { all: contacts.length, active: 0, lead: 0, inactive: 0 };
    for (const c of contacts) counts[c.status]++;
    return counts;
  }, [contacts]);

  const filteredContacts = useMemo(
    () =>
      filterAndSortContacts(contacts, {
        search: searchQuery,
        status: activeFilter,
        company: companyFilter,
        sort,
      }),
    [contacts, searchQuery, activeFilter, companyFilter, sort]
  );

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
  const hasActiveFilters =
    hasSearch || activeFilter !== "all" || companyFilter !== "all";

  const handleClearFilters = () => {
    setSearchQuery("");
    setActiveFilter("all");
    setCompanyFilter("all");
    setPage(1);
  };

  const avgAiScore =
    contacts.length > 0
      ? Math.round(contacts.reduce((s, c) => s + c.aiLeadScore, 0) / contacts.length)
      : 0;

  if (loading) {
    return (
      <>
        <CrmPageHeader
          badge="CRM · Contacts"
          title="Your"
          titleAccent="Contacts"
          description="Track relationships across your workspace."
        />
        <div className="mb-6">
          <CrmSubNav />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[#1E293B] bg-[#111827] p-4 sm:p-5 space-y-3">
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
        badge="CRM · Contacts"
        title="Your"
        titleAccent="Contacts"
        description="Create, edit, filter, and manage customer contacts."
      />
      <div className="mb-6">
        <CrmSubNav />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
        <CrmStatCard title="Total contacts" value={contacts.length} />
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
              {filteredContacts.length !== contacts.length &&
                ` · filtered from ${contacts.length}`}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8] shrink-0"
          >
            + Add contact
          </button>
        </div>

        <div className="mb-4">
          <CrmSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name, email, or company..."
          />
        </div>

        <div className="mb-4">
          <CrmFilterChips
            chips={chips}
            activeId={activeFilter}
            onChange={(id) => setActiveFilter(id as ContactFilter)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <CrmSelectFilter
            label="Company"
            value={companyFilter}
            onChange={setCompanyFilter}
            options={[
              { value: "all", label: "All companies" },
              ...companies.map((name) => ({ value: name, label: name })),
            ]}
          />
          <CrmSelectFilter
            label="Sort"
            value={sort}
            onChange={(v) => setSort(v as CrmContactSort)}
            options={[
              { value: "name-asc", label: "Name A -> Z" },
              { value: "name-desc", label: "Name Z -> A" },
              { value: "score-desc", label: "AI score" },
              { value: "newest", label: "Newest" },
            ]}
          />
        </div>

        {filteredContacts.length === 0 ? (
          <CrmEmptyState
            title={
              hasActiveFilters
                ? hasSearch
                  ? "No contacts match your search"
                  : "No contacts match your filters"
                : "Add your first contact"
            }
            description={
              hasActiveFilters
                ? "Try a different search term or reset your filters."
                : "Create your first contact to start your CRM pipeline."
            }
            cta={
              hasActiveFilters
                ? { label: "Clear filters", onClick: handleClearFilters }
                : { label: "Add contact", onClick: openCreate }
            }
          />
        ) : (
          <>
            <div className="lg:hidden space-y-2 mb-4">
              {paginatedContacts.map((contact) => (
                <ContactListItem
                  key={contact.id}
                  contact={contact}
                  onEdit={openEdit}
                  onDelete={deleteContact}
                />
              ))}
            </div>
            <div className="hidden lg:block">
              <ContactsTable
                contacts={paginatedContacts}
                onEdit={openEdit}
                onDelete={deleteContact}
              />
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

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${dashboard.panelLg} w-full max-w-xl`}>
            <h3 className="text-xl font-bold text-white mb-4">
              {editing ? "Edit contact" : "Create contact"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={form.name ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Name"
                className={`${dashboard.input} px-3 py-2 sm:col-span-2`}
              />
              <input
                value={form.email ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Email"
                className={`${dashboard.input} px-3 py-2`}
              />
              <input
                value={form.companyName ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, companyName: e.target.value }))
                }
                placeholder="Company"
                className={`${dashboard.input} px-3 py-2`}
              />
              <select
                value={form.status ?? "lead"}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as CrmContactStatus,
                  }))
                }
                className={`${dashboard.input} px-3 py-2`}
              >
                <option value="lead">Lead</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <input
                type="number"
                min={0}
                max={100}
                value={form.aiLeadScore ?? 0}
                onChange={(e) =>
                  setForm((f) => ({ ...f, aiLeadScore: Number(e.target.value) }))
                }
                placeholder="AI score (0-100)"
                className={`${dashboard.input} px-3 py-2`}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className={`${dashboard.btnSecondary} px-4 py-2`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || !form.name?.trim()}
                onClick={() => void saveContact()}
                className={`${dashboard.btnPrimary} px-4 py-2 disabled:opacity-60`}
              >
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
