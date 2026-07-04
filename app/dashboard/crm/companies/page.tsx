"use client";

import { useEffect, useMemo, useState } from "react";
import { CompanyListItem } from "@/components/crm/CompanyListItem";
import { CrmEmptyState, CompanyEmptyIcon } from "@/components/crm/CrmEmptyState";
import { CrmFilterChips } from "@/components/crm/CrmFilterChips";
import { CrmListSkeleton } from "@/components/crm/CrmListSkeleton";
import { CrmPageHeader } from "@/components/crm/CrmPageHeader";
import { CrmSearchInput } from "@/components/crm/CrmSearchInput";
import { CrmSelectFilter } from "@/components/crm/CrmSelectFilter";
import { CrmStatCard } from "@/components/crm/CrmStatCard";
import { CrmSubNav } from "@/components/crm/CrmSubNav";
import {
  CRM_INDUSTRIES,
  CRM_OWNERS,
  filterCompanies,
  sortCompanies,
} from "@/lib/crm/entities";
import { formatCurrency, MOCK_COMPANIES } from "@/lib/crm/mock-data";
import type { CompanySize, CompanySort } from "@/lib/crm/types";

type CompanyFilter = "all" | CompanySize;

export default function CompaniesPage() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<CompanyFilter>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [sort, setSort] = useState<CompanySort>("name-asc");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const filterCounts = useMemo(() => {
    const counts = { all: MOCK_COMPANIES.length, startup: 0, smb: 0, enterprise: 0 };
    for (const c of MOCK_COMPANIES) counts[c.size]++;
    return counts;
  }, []);

  const totalPipeline = useMemo(
    () => MOCK_COMPANIES.reduce((sum, c) => sum + c.totalPipeline, 0),
    []
  );

  const filteredCompanies = useMemo(() => {
    const filtered = filterCompanies(MOCK_COMPANIES, {
      search: searchQuery,
      size: activeFilter,
      industry: industryFilter,
      owner: ownerFilter,
      status: statusFilter,
    });
    return sortCompanies(filtered, sort);
  }, [searchQuery, activeFilter, industryFilter, ownerFilter, statusFilter, sort]);

  const chips = [
    { id: "all", label: "All", count: filterCounts.all },
    { id: "enterprise", label: "Enterprise", count: filterCounts.enterprise },
    { id: "smb", label: "SMB", count: filterCounts.smb },
    { id: "startup", label: "Startup", count: filterCounts.startup },
  ];

  const hasSearch = searchQuery.trim().length > 0;
  const avgAiScore = Math.round(
    MOCK_COMPANIES.reduce((s, c) => s + c.aiScore, 0) / MOCK_COMPANIES.length
  );

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
        <CrmStatCard title="Total companies" value={MOCK_COMPANIES.length} />
        <CrmStatCard title="Enterprise" value={filterCounts.enterprise} />
        <CrmStatCard title="Total pipeline" value={formatCurrency(totalPipeline)} />
        <CrmStatCard title="Avg. AI score" value={avgAiScore} />
      </div>

      <div className="bg-[#0B1220]/80 border border-blue-400/20 rounded-3xl p-5 sm:p-6 lg:p-8 backdrop-blur-sm shadow-lg shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold">All companies</h2>
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8] opacity-60 cursor-not-allowed"
            title="Coming soon"
          >
            + Add company
          </button>
        </div>

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
            options={CRM_INDUSTRIES.map((i) => ({
              value: i,
              label: i === "all" ? "All industries" : i,
            }))}
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
            icon={<CompanyEmptyIcon className="w-8 h-8 text-blue-400/60" />}
            title={
              hasSearch
                ? "No companies match your search"
                : "No companies match your filters"
            }
            description="Try a different search term or adjust your filters."
          />
        ) : (
          <div className="space-y-2">
            {filteredCompanies.map((company) => (
              <CompanyListItem key={company.id} company={company} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
