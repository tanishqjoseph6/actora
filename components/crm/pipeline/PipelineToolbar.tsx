"use client";

import { CrmSearchInput } from "@/components/crm/CrmSearchInput";
import {
  AI_SCORE_FILTER_OPTIONS,
  PIPELINE_COMPANIES,
  PIPELINE_OWNERS,
  PIPELINE_STAGES,
  type PipelineSort,
} from "@/lib/crm/pipeline";
import type { DealStage } from "@/lib/crm/types";

export type PipelineFilters = {
  search: string;
  owner: string;
  companyId: string;
  priority: string;
  stage: string;
  aiScoreTier: string;
  sort: PipelineSort;
};

type PipelineToolbarProps = {
  filters: PipelineFilters;
  onChange: (filters: PipelineFilters) => void;
  totalDeals: number;
  filteredCount: number;
  companies?: { id: string; name: string }[];
  owners?: string[];
};

export function PipelineToolbar({
  filters,
  onChange,
  totalDeals,
  filteredCount,
  companies = PIPELINE_COMPANIES,
  owners = [...PIPELINE_OWNERS],
}: PipelineToolbarProps) {
  const update = (patch: Partial<PipelineFilters>) =>
    onChange({ ...filters, ...patch });

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex-1 min-w-0">
          <CrmSearchInput
            value={filters.search}
            onChange={(search) => update({ search })}
            placeholder="Search deals, companies, contacts, labels…"
          />
        </div>
        <p className="text-xs text-[#71717A] shrink-0 tabular-nums">
          Showing {filteredCount} of {totalDeals} deals
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        <SelectFilter
          label="Owner"
          value={filters.owner}
          onChange={(owner) => update({ owner })}
          options={[
            { value: "all", label: "All owners" },
            ...owners.map((o) => ({ value: o, label: o })),
          ]}
        />
        <SelectFilter
          label="Company"
          value={filters.companyId}
          onChange={(companyId) => update({ companyId })}
          options={[
            { value: "all", label: "All companies" },
            ...companies.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <SelectFilter
          label="Stage"
          value={filters.stage}
          onChange={(stage) => update({ stage })}
          options={[
            { value: "all", label: "All stages" },
            ...PIPELINE_STAGES.map((s) => ({ value: s.id, label: s.label })),
          ]}
        />
        <SelectFilter
          label="Priority"
          value={filters.priority}
          onChange={(priority) => update({ priority })}
          options={[
            { value: "all", label: "All priorities" },
            { value: "high", label: "High" },
            { value: "medium", label: "Medium" },
            { value: "low", label: "Low" },
          ]}
        />
        <SelectFilter
          label="AI score"
          value={filters.aiScoreTier}
          onChange={(aiScoreTier) => update({ aiScoreTier })}
          options={AI_SCORE_FILTER_OPTIONS.map((o) => ({
            value: o.value,
            label: o.label,
          }))}
        />
        <SelectFilter
          label="Sort by"
          value={filters.sort}
          onChange={(sort) => update({ sort: sort as PipelineSort })}
          options={[
            { value: "value-desc", label: "Deal value" },
            { value: "close-date", label: "Close date" },
            { value: "ai-score", label: "AI score" },
          ]}
        />
      </div>
    </div>
  );
}

function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <label className="text-[10px] uppercase tracking-wider text-[#71717A] shrink-0 w-14">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-[#111111] border border-white/[0.06] text-sm text-[#A1A1AA] focus:outline-none focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#2563EB]/20 transition-all cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#111111]">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function getVisibleStages(stageFilter: string): DealStage[] {
  if (stageFilter !== "all") {
    return [stageFilter as DealStage];
  }
  return PIPELINE_STAGES.map((s) => s.id);
}
