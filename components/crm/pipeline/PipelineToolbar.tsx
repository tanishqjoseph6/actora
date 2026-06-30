"use client";

import { CrmSearchInput } from "@/components/crm/CrmSearchInput";
import {
  PIPELINE_OWNERS,
  PIPELINE_STAGES,
  type PipelineSort,
} from "@/lib/crm/pipeline";
import type { DealStage } from "@/lib/crm/types";

export type PipelineFilters = {
  search: string;
  owner: string;
  priority: string;
  stage: string;
  sort: PipelineSort;
};

type PipelineToolbarProps = {
  filters: PipelineFilters;
  onChange: (filters: PipelineFilters) => void;
  totalDeals: number;
  filteredCount: number;
};

export function PipelineToolbar({
  filters,
  onChange,
  totalDeals,
  filteredCount,
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
        <p className="text-xs text-gray-500 shrink-0 tabular-nums">
          Showing {filteredCount} of {totalDeals} deals
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
        <SelectFilter
          label="Owner"
          value={filters.owner}
          onChange={(owner) => update({ owner })}
          options={[
            { value: "all", label: "All owners" },
            ...PIPELINE_OWNERS.map((o) => ({ value: o, label: o })),
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
          label="Stage"
          value={filters.stage}
          onChange={(stage) => update({ stage })}
          options={[
            { value: "all", label: "All stages" },
            ...PIPELINE_STAGES.map((s) => ({ value: s.id, label: s.label })),
          ]}
        />
        <SelectFilter
          label="Sort by"
          value={filters.sort}
          onChange={(sort) => update({ sort: sort as PipelineSort })}
          options={[
            { value: "value-desc", label: "Value (high → low)" },
            { value: "value-asc", label: "Value (low → high)" },
            { value: "close-date", label: "Close date" },
            { value: "ai-score", label: "AI score" },
            { value: "last-activity", label: "Last activity" },
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
      <label className="text-[10px] uppercase tracking-wider text-gray-500 shrink-0">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 sm:flex-none min-w-[140px] px-3 py-2 rounded-xl bg-[#0d1730] border border-cyan-400/15 text-sm text-gray-300 focus:outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20 transition-all cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#0d1730]">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function getVisibleStages(
  stageFilter: string
): DealStage[] {
  if (stageFilter !== "all") {
    return [stageFilter as DealStage];
  }
  return PIPELINE_STAGES.map((s) => s.id);
}
