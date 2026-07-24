"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DealListItem } from "@/components/crm/DealListItem";
import { CrmEmptyState } from "@/components/crm/CrmEmptyState";
import { CrmFilterChips } from "@/components/crm/CrmFilterChips";
import { CrmListSkeleton } from "@/components/crm/CrmListSkeleton";
import { CrmPageHeader } from "@/components/crm/CrmPageHeader";
import { CrmSearchInput } from "@/components/crm/CrmSearchInput";
import { CrmStatCard } from "@/components/crm/CrmStatCard";
import { CrmSubNav } from "@/components/crm/CrmSubNav";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { formatCurrency } from "@/lib/crm/mock-data";
import { filterDeals, type CrmDeal } from "@/lib/crm/entities-live";
import type { Deal, DealStage } from "@/lib/crm/types";

type DealFilter = "all" | "open" | "won" | "lost" | DealStage;

const OPEN_STAGES: DealStage[] = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
];

function toDealList(deal: CrmDeal): Deal {
  return {
    id: deal.id,
    title: deal.title,
    companyId: deal.companyId ?? "",
    companyName: deal.companyName,
    contactId: deal.contactId ?? "",
    contactName: deal.contactName,
    stage: deal.stage,
    value: deal.value,
    probability: deal.probability,
    closeDate: deal.closeDate,
    owner: deal.owner,
  };
}

export default function DealsPage() {
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<CrmDeal[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<DealFilter>("all");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", value: "", companyName: "" });

  const loadDeals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/crm/deals");
      const json = (await res.json()) as { deals?: CrmDeal[]; error?: string };
      if (!res.ok) {
        setFormError(json.error ?? "Could not load deals.");
        setDeals([]);
        return;
      }
      setDeals(json.deals ?? []);
    } catch {
      setFormError("Could not load deals.");
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDeals();
  }, [loadDeals]);

  async function createDeal() {
    const title = form.title.trim();
    if (!title || saving) return;
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch("/api/crm/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          value: Number(form.value) || 0,
        }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setFormError(json.error ?? "Could not create deal.");
        return;
      }
      setShowForm(false);
      setForm({ title: "", value: "", companyName: "" });
      await loadDeals();
    } catch {
      setFormError("Could not create deal.");
    } finally {
      setSaving(false);
    }
  }

  const filterCounts = useMemo(() => {
    const open = deals.filter((d) => OPEN_STAGES.includes(d.stage)).length;
    const won = deals.filter((d) => d.stage === "won").length;
    const lost = deals.filter((d) => d.stage === "lost").length;
    return { all: deals.length, open, won, lost };
  }, [deals]);

  const openPipeline = useMemo(
    () =>
      deals
        .filter((d) => OPEN_STAGES.includes(d.stage))
        .reduce((sum, d) => sum + d.value, 0),
    [deals]
  );

  const filteredDeals = useMemo(() => {
    let list = filterDeals(deals, { search: searchQuery });
    if (activeFilter === "open") {
      list = list.filter((d) => OPEN_STAGES.includes(d.stage));
    } else if (activeFilter === "won") {
      list = list.filter((d) => d.stage === "won");
    } else if (activeFilter === "lost") {
      list = list.filter((d) => d.stage === "lost");
    } else if (
      activeFilter !== "all" &&
      !["open", "won", "lost"].includes(activeFilter)
    ) {
      list = list.filter((d) => d.stage === activeFilter);
    }
    return list;
  }, [searchQuery, activeFilter, deals]);

  const chips = [
    { id: "all", label: "All", count: filterCounts.all },
    { id: "open", label: "Open", count: filterCounts.open },
    {
      id: "negotiation",
      label: "Negotiation",
      count: deals.filter((d) => d.stage === "negotiation").length,
    },
    {
      id: "proposal",
      label: "Proposal",
      count: deals.filter((d) => d.stage === "proposal").length,
    },
    { id: "won", label: "Won", count: filterCounts.won },
    { id: "lost", label: "Lost", count: filterCounts.lost },
  ];

  const hasSearch = searchQuery.trim().length > 0;
  const hasActiveFilters = hasSearch || activeFilter !== "all";

  const handleClearFilters = () => {
    setSearchQuery("");
    setActiveFilter("all");
  };

  const winRate =
    filterCounts.won + filterCounts.lost > 0
      ? Math.round(
          (filterCounts.won / (filterCounts.won + filterCounts.lost)) * 100
        )
      : 0;

  if (loading) {
    return (
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
        <CrmListSkeleton rows={6} />
      </>
    );
  }

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
          <CrmStatCard title="Total deals" value={deals.length} />
          <CrmStatCard title="Open pipeline" value={formatCurrency(openPipeline)} />
          <CrmStatCard title="Won" value={filterCounts.won} hint="Closed-won deals" />
          <CrmStatCard title="Win rate" value={`${winRate}%`} />
        </div>

        <div className={dashboard.panelLg}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">All deals</h2>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
            >
              + Add deal
            </button>
          </div>

          {showForm && (
            <div className="mb-6 p-4 rounded-xl border border-white/[0.06] bg-[#111111] space-y-3">
              {formError && (
                <p className="text-sm text-red-400" role="alert">
                  {formError}
                </p>
              )}
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Deal title"
                className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/[0.06] text-sm text-white"
              />
              <input
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                placeholder="Value (USD)"
                type="number"
                className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/[0.06] text-sm text-white"
              />
              <button
                type="button"
                onClick={() => void createDeal()}
                disabled={!form.title.trim() || saving}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#2563EB] text-white disabled:opacity-50"
              >
                {saving ? "Creating…" : "Create deal"}
              </button>
            </div>
          )}

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
                <DealListItem key={deal.id} deal={toDealList(deal)} />
              ))}
            </div>
          )}
        </div>
      </>
    </FeatureGate>
  );
}
