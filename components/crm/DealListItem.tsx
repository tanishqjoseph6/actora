import { formatCurrency, formatDate } from "@/lib/crm/mock-data";
import type { Deal, DealStage } from "@/lib/crm/types";

const STAGE_LABELS: Record<DealStage, string> = {
  lead: "Lead",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

const STAGE_STYLES: Record<DealStage, string> = {
  lead: "bg-gray-500/15 border-gray-400/25 text-gray-300",
  qualified: "bg-blue-500/15 border-blue-400/25 text-blue-300",
  proposal: "bg-violet-500/15 border-violet-400/25 text-violet-300",
  negotiation: "bg-amber-500/15 border-amber-400/25 text-amber-300",
  won: "bg-emerald-500/15 border-emerald-400/25 text-emerald-400",
  lost: "bg-red-500/15 border-red-400/25 text-red-400",
};

export function DealListItem({ deal }: { deal: Deal }) {
  const isClosed = deal.stage === "won" || deal.stage === "lost";

  return (
    <article className="group flex flex-col xl:flex-row xl:items-center gap-4 p-4 sm:p-5 rounded-2xl bg-[#0d1730]/40 border border-cyan-400/10 hover:border-cyan-400/25 hover:bg-[#0d1730]/70 transition-all duration-200">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3 className="font-semibold text-white">{deal.title}</h3>
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${STAGE_STYLES[deal.stage]}`}
          >
            {STAGE_LABELS[deal.stage]}
          </span>
        </div>
        <p className="text-sm text-gray-400">
          {deal.companyName} · {deal.contactName}
        </p>
        <p className="text-xs text-gray-500 mt-1">Owner · {deal.owner}</p>
      </div>

      <div className="flex flex-wrap items-center gap-4 xl:gap-8 shrink-0">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500">
            Value
          </p>
          <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#60A5FA] to-[#00CFFF]">
            {formatCurrency(deal.value)}
          </p>
        </div>

        {!isClosed && (
          <div className="min-w-[100px]">
            <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
              <span>Probability</span>
              <span className="text-cyan-400">{deal.probability}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#081226] border border-cyan-400/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#3B82F6] to-[#00CFFF] transition-all"
                style={{ width: `${deal.probability}%` }}
              />
            </div>
          </div>
        )}

        <div className="text-right min-w-[100px]">
          <p className="text-[10px] uppercase tracking-wider text-gray-500">
            Close date
          </p>
          <p className="text-sm text-gray-300">{formatDate(deal.closeDate)}</p>
        </div>
      </div>
    </article>
  );
}
