"use client";

import { useEffect, useMemo, useState } from "react";
import { CompanyListItem } from "@/components/crm/CompanyListItem";
import { CrmEmptyState } from "@/components/crm/CrmEmptyState";
import { CrmFilterChips } from "@/components/crm/CrmFilterChips";
import { CrmListSkeleton } from "@/components/crm/CrmListSkeleton";
import { CrmPageHeader } from "@/components/crm/CrmPageHeader";
import { CrmSearchInput } from "@/components/crm/CrmSearchInput";
import { CrmSelectFilter } from "@/components/crm/CrmSelectFilter";
import { CrmStatCard } from "@/components/crm/CrmStatCard";
import { CrmSubNav } from "@/components/crm/CrmSubNav";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import {
  filterCompanies,
  sortCompanies,
  type CrmCompany,
  type CompanySort,
} from "@/lib/crm/entities-live";
import { formatCurrency } from "@/lib/crm/mock-data";
import type { Company, CompanySize } from "@/lib/crm/types";

type CompanyFilter = "all" | CompanySize;

function toCompanyListItem(c: CrmCompany): Company {
  return {
    id: c.id,
    name: c.name,
    industry: c.industry,
    size: c.size,
    status: c.status,
    website: c.website,
    address: c.address,
    notes: c.notes,
    revenue: c.revenue,
    employeeCount: c.employeeCount,
    owner: c.owner,
    aiScore: c.aiScore,
    openDeals: c.openDeals,
    totalPipeline: c.totalPipeline,
  };
}

export default function CompaniesPage() {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<CrmCompany[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<CompanyFilter>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [sort, setSort] = useState<CompanySort>("name-asc");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", industry: "" });

  useEffect(() => {
    void loadCompanies();
  }, []);

  async function loadCompanies() {
    setLoading(true);
    try {
      const res = await fetch("/api/crm/companies");
      const json = (await res.json()) as { companies?: CrmCompany[] };
      setCompanies(json.companies ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function createCompany() {
    const name = form.name.trim();
    if (!name || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/crm/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          industry: form.industry.trim(),
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ name: "", industry: "" });
        await loadCompanies();
      }
    } finally {
      setSaving(false);
    }
  }

  const industries = useMemo(
    () =>
      ["all", ...Array.from(new Set(companies.map((c) => c.industry).filter(Boolean))).sort()],
    [companies]
  );

  const owners = useMemo(
    () =>
      ["all", ...Array.from(new Set(companies.map((c) => c.owner).filter(Boolean))).sort()],
    [companies]
  );

  const filterCounts = useMemo(() => {
    const counts = { all: companies.length, startup: 0, smb: 0, enterprise: 0 };
    for (const c of companies) counts[c.size]++;
    return counts;
  }, [companies]);

  const totalPipeline = useMemo(
    () => companies.reduce((sum, c) => sum + c.totalPipeline, 0),
    [companies]
  );

  const filteredCompanies = useMemo(() => {
    const filtered = filterCompanies(companies, {
      search: searchQuery,
      size: activeFilter,
      industry: industryFilter,
      owner: ownerFilter,
      status: statusFilter,
    });
    return sortCompanies(filtered, sort);
  }, [searchQuery, activeFilter, industryFilter, ownerFilter, statusFilter, sort, companies]);

  const chips = [
    { id: "all", label: "All", count: filterCounts.all },
    { id: "enterprise", label: "Enterprise", count: filterCounts.enterprise },
    { id: "smb", label: "SMB", count: filterCounts.smb },
    { id: "startup", label: "Startup", count: filterCounts.startup },
  ];

  const hasSearch = searchQuery.trim().length > 0;
  const hasActiveFilters =
    hasSearch ||
    activeFilter !== "all" ||
    statusFilter !== "all" ||
    industryFilter !== "all" ||
    ownerFilter !== "all";

  const handleClearFilters = () => {
    setSearchQuery("");
    setActiveFilter("all");
    setStatusFilter("all");
    setIndustryFilter("all");
    setOwnerFilter("all");
  };

  const avgAiScore =
    companies.length > 0
      ? Math.round(companies.reduce((s, c) => s + c.aiScore, 0) / companies.length)
      : 0;

  if (loading) {
    return (
      <>
        <CrmPageHeader
          badge="🏢 CRM · Companies"
          title="Account"
          titleAccent="Companies"
          description="Organize accounts by size, industry, and pipeline value across your book of business."
        />
        <div className="mb-6">
          <CrmSubNav />
        </div>
        <CrmListSkeleton rows={6} />
      </>
    );
  }

  return (
    <FeatureGate feature="full_crm" fullPage>
      <>
        <CrmPageHeader
          badge="🏢 CRM · Companies"
          title="Account"
          titleAccent="Companies"
          description="Organize accounts by size, industry, and pipeline value across your book of business."
        />

        <div className="mb-6">
          <CrmSubNav />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
          <CrmStatCard title="Total companies" value={companies.length} />
          <CrmStatCard title="Enterprise" value={filterCounts.enterprise} />
          <CrmStatCard title="Total pipeline" value={formatCurrency(totalPipeline)} />
          <CrmStatCard title="Avg. AI score" value={avgAiScore} />
        </div>

        <div className={dashboard.panelLg}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">All companies</h2>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
            >
              + Add company
            </button>
          </div>

          {showForm && (
            <div className="mb-6 p-4 rounded-xl border border-white/[0.06] bg-[#111111] space-y-3">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Company name"
                className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/[0.06] text-sm text-white"
              />
              <input
                value={form.industry}
                onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                placeholder="Industry"
                className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/[0.06] text-sm text-white"
              />
              <button
                type="button"
                onClick={() => void createCompany()}
                disabled={!form.name.trim() || saving}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#2563EB] text-white disabled:opacity-50"
              >
                {saving ? "Creating…" : "Create company"}
              </button>
            </div>
          )}

          <div className="mb-4">
            <CrmSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name, industry, address, owner, or notes…"
            />
          </div>

          <div className="mb-4">
            <CrmFilterChips
              chips={chips}
              activeId={activeFilter}
              onChange={(id) => setActiveFilter(id as CompanyFilter)}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 mb-6">
            <CrmSelectFilter
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All statuses" },
                { value: "active", label: "Active" },
                { value: "prospect", label: "Prospect" },
                { value: "churned", label: "Churned" },
              ]}
            />
            <CrmSelectFilter
              label="Industry"
              value={industryFilter}
              onChange={setIndustryFilter}
              options={industries.map((i) => ({
                value: i,
                label: i === "all" ? "All industries" : i,
              }))}
            />
            <CrmSelectFilter
              label="Owner"
              value={ownerFilter}
              onChange={setOwnerFilter}
              options={owners.map((o) => ({
                value: o,
                label: o === "all" ? "All owners" : o,
              }))}
            />
            <CrmSelectFilter
              label="Sort"
              value={sort}
              onChange={(v) => setSort(v as CompanySort)}
              options={[
                { value: "name-asc", label: "Name A → Z" },
                { value: "name-desc", label: "Name Z → A" },
                { value: "revenue-desc", label: "Revenue (high → low)" },
                { value: "employees-desc", label: "Employees" },
                { value: "ai-score-desc", label: "AI score" },
                { value: "pipeline-desc", label: "Pipeline value" },
              ]}
            />
          </div>

          {filteredCompanies.length === 0 ? (
            <CrmEmptyState
              title={
                hasActiveFilters
                  ? hasSearch
                    ? "No companies match your search"
                    : "No companies match your filters"
                  : "Map every account in your pipeline"
              }
              description={
                hasActiveFilters
                  ? "Try a different search term or reset your filters to browse all companies."
                  : "Track firmographics, pipeline value, and AI scores per account — so your team always knows where to focus."
              }
              cta={
                hasActiveFilters
                  ? { label: "Clear filters", onClick: handleClearFilters }
                  : { label: "Add your first company", onClick: () => setShowForm(true) }
              }
            />
          ) : (
            <div className="space-y-2">
              {filteredCompanies.map((company) => (
                <CompanyListItem
                  key={company.id}
                  company={toCompanyListItem(company)}
                  contactsCount={company.contactCount}
                />
              ))}
            </div>
          )}
        </div>
      </>
    </FeatureGate>
  );
}
