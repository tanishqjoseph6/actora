"use client";

import { useMemo, useState } from "react";
import { CompanyListItem } from "@/components/crm/CompanyListItem";
import { CrmEmptyState, CompanyEmptyIcon } from "@/components/crm/CrmEmptyState";
import { CrmFilterChips } from "@/components/crm/CrmFilterChips";
import { CrmPageHeader } from "@/components/crm/CrmPageHeader";
import { CrmSearchInput } from "@/components/crm/CrmSearchInput";
import { CrmStatCard } from "@/components/crm/CrmStatCard";
import { CrmSubNav } from "@/components/crm/CrmSubNav";
import { formatCurrency, MOCK_COMPANIES } from "@/lib/crm/mock-data";
import type { CompanySize } from "@/lib/crm/types";

type CompanyFilter = "all" | CompanySize;

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<CompanyFilter>("all");

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
    const query = searchQuery.trim().toLowerCase();
    return MOCK_COMPANIES.filter((company) => {
      if (activeFilter !== "all" && company.size !== activeFilter) return false;
      if (!query) return true;
      return (
        company.name.toLowerCase().includes(query) ||
        company.industry.toLowerCase().includes(query) ||
        company.location.toLowerCase().includes(query) ||
        company.website.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, activeFilter]);

  const chips = [
    { id: "all", label: "All", count: filterCounts.all },
    { id: "enterprise", label: "Enterprise", count: filterCounts.enterprise },
    { id: "smb", label: "SMB", count: filterCounts.smb },
    { id: "startup", label: "Startup", count: filterCounts.startup },
  ];

  const hasSearch = searchQuery.trim().length > 0;

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
        <CrmStatCard
          title="Total pipeline"
          value={formatCurrency(totalPipeline)}
        />
        <CrmStatCard
          title="Avg. open deals"
          value={
            (
              MOCK_COMPANIES.reduce((s, c) => s + c.openDeals, 0) /
              MOCK_COMPANIES.length
            ).toFixed(1)
          }
        />
      </div>

      <div className="bg-[#081226]/80 border border-cyan-400/20 rounded-3xl p-5 sm:p-6 lg:p-8 backdrop-blur-sm shadow-lg shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold">All companies</h2>
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#3B82F6] to-[#00CFFF] text-[#050816] opacity-60 cursor-not-allowed"
            title="Coming soon"
          >
            + Add company
          </button>
        </div>

        <div className="mb-4">
          <CrmSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name, industry, location, or website…"
          />
        </div>

        <div className="mb-6">
          <CrmFilterChips
            chips={chips}
            activeId={activeFilter}
            onChange={(id) => setActiveFilter(id as CompanyFilter)}
          />
        </div>

        {filteredCompanies.length === 0 ? (
          <CrmEmptyState
            icon={<CompanyEmptyIcon className="w-8 h-8 text-cyan-400/60" />}
            title={
              hasSearch
                ? "No companies match your search"
                : "No companies in this segment"
            }
            description={
              hasSearch
                ? "Try a different search term or clear your filters."
                : "Adjust your size filter to see companies in this category."
            }
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
