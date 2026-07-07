"use client";

import { useMemo, useState } from "react";
import { DealListItem } from "@/components/crm/DealListItem";
import { CrmEmptyState } from "@/components/crm/CrmEmptyState";
import { CrmFilterChips } from "@/components/crm/CrmFilterChips";
import { CrmPageHeader } from "@/components/crm/CrmPageHeader";
import { CrmSearchInput } from "@/components/crm/CrmSearchInput";
import { CrmStatCard } from "@/components/crm/CrmStatCard";
import { CrmSubNav } from "@/components/crm/CrmSubNav";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { formatCurrency, MOCK_DEALS } from "@/lib/crm/mock-data";
import type { DealStage } from "@/lib/crm/types";

type DealFilter = "all" | "open" | "won" | "lost" | DealStage;

const OPEN_STAGES: DealStage[] = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
];

export default function DealsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<DealFilter>("all");

  const filterCounts = useMemo(() => {
    const open = MOCK_DEALS.filter((d) => OPEN_STAGES.includes(d.stage)).length;
    const won = MOCK_DEALS.filter((d) => d.stage === "won").length;
    const lost = MOCK_DEALS.filter((d) => d.stage === "lost").length;
    return { all: MOCK_DEALS.length, open, won, lost };
  }, []);

  const openPipeline = useMemo(
    () =>
      MOCK_DEALS.filter((d) => OPEN_STAGES.includes(d.stage)).reduce(
        (sum, d) => sum + d.value,
        0
      ),
    []
  );

  const filteredDeals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return MOCK_DEALS.filter((deal) => {
      if (activeFilter === "open" && !OPEN_STAGES.includes(deal.stage))
        return false;
      if (activeFilter === "won" && deal.stage !== "won") return false;
      if (activeFilter === "lost" && deal.stage !== "lost") return false;
      if (
        activeFilter !== "all" &&
        activeFilter !== "open" &&
        activeFilter !== "won" &&
        activeFilter !== "lost" &&
        deal.stage !== activeFilter
      ) {
        return false;
      }

      if (!query) return true;
      return (
        deal.title.toLowerCase().includes(query) ||
        deal.companyName.toLowerCase().includes(query) ||
        deal.contactName.toLowerCase().includes(query) ||
        deal.owner.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, activeFilter]);

  const chips = [
    { id: "all", label: "All", count: filterCounts.all },
    { id: "open", label: "Open", count: filterCounts.open },
    { id: "negotiation", label: "Negotiation", count: MOCK_DEALS.filter((d) => d.stage === "negotiation").length },
    { id: "proposal", label: "Proposal", count: MOCK_DEALS.filter((d) => d.stage === "proposal").length },
    { id: "won", label: "Won", count: filterCounts.won },
    { id: "lost", label: "Lost", count: filterCounts.lost },
  ];

  const hasSearch = searchQuery.trim().length > 0;
  const hasActiveFilters = hasSearch || activeFilter !== "all";

  const handleClearFilters = () => {
    setSearchQuery("");
    setActiveFilter("all");
  };

  return (
    <FeatureGate feature="full_crm" fullPage>
    <>
      <CrmPageHeader
        badge="💼 CRM · Deals"
        title="Sales"
        titleAccent="Pipeline"
        description="Monitor deal stages, forecast revenue, and track progress from first touch to close."
      />

      <div className="mb-6">
        <CrmSubNav />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
        <CrmStatCard title="Total deals" value={MOCK_DEALS.length} />
        <CrmStatCard title="Open pipeline" value={formatCurrency(openPipeline)} />
        <CrmStatCard title="Won" value={filterCounts.won} hint="Closed-won deals" />
        <CrmStatCard
          title="Win rate"
          value={`${Math.round((filterCounts.won / (filterCounts.won + filterCounts.lost)) * 100)}%`}
        />
      </div>

      <div className={dashboard.panelLg}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold">All deals</h2>
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8] opacity-60 cursor-not-allowed"
            title="Coming soon"
          >
            + Add deal
          </button>
        </div>

        <div className="mb-4">
          <CrmSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by deal, company, contact, or owner…"
          />
        </div>

        <div className="mb-6">
          <CrmFilterChips
            chips={chips}
            activeId={activeFilter}
            onChange={(id) => setActiveFilter(id as DealFilter)}
          />
        </div>

        {filteredDeals.length === 0 ? (
          <CrmEmptyState
            title={
              hasActiveFilters
                ? hasSearch
                  ? "No deals match your search"
                  : "No deals in this stage"
                : "Track revenue from lead to close"
            }
            description={
              hasActiveFilters
                ? "Try a different search term or reset your stage filter to see the full pipeline."
                : "Deals tie contacts, companies, and forecast value together — so you always know what's moving and what's at risk."
            }
            cta={
              hasActiveFilters
                ? { label: "Clear filters", onClick: handleClearFilters }
                : { label: "View pipeline board", href: "/dashboard/crm/pipeline" }
            }
          />
        ) : (
          <div className="space-y-2">
            {filteredDeals.map((deal) => (
              <DealListItem key={deal.id} deal={deal} />
            ))}
          </div>
        )}
      </div>
    </>
    </FeatureGate>
  );
}
