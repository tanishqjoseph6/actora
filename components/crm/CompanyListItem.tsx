import { formatCurrency } from "@/lib/crm/mock-data";
import type { Company, CompanySize } from "@/lib/crm/types";

const SIZE_LABELS: Record<CompanySize, string> = {
  startup: "Startup",
  smb: "SMB",
  enterprise: "Enterprise",
};

const SIZE_STYLES: Record<CompanySize, string> = {
  startup: "bg-violet-500/15 border-violet-400/25 text-violet-300",
  smb: "bg-cyan-500/15 border-cyan-400/25 text-cyan-300",
  enterprise: "bg-amber-500/15 border-amber-400/25 text-amber-300",
};

export function CompanyListItem({ company }: { company: Company }) {
  return (
    <article className="group flex flex-col lg:flex-row lg:items-center gap-4 p-4 sm:p-5 rounded-2xl bg-[#0d1730]/40 border border-cyan-400/10 hover:border-cyan-400/25 hover:bg-[#0d1730]/70 transition-all duration-200">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#3B82F6]/30 to-[#00CFFF]/20 border border-cyan-400/20 flex items-center justify-center text-lg shrink-0">
          🏢
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-white">{company.name}</h3>
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${SIZE_STYLES[company.size]}`}
            >
              {SIZE_LABELS[company.size]}
            </span>
          </div>
          <p className="text-sm text-gray-400">{company.industry}</p>
          <p className="text-sm text-gray-500 mt-0.5">{company.location}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 lg:gap-6 lg:min-w-[320px] shrink-0">
        <Metric label="Contacts" value={company.contactsCount} />
        <Metric label="Open deals" value={company.openDeals} />
        <Metric
          label="Pipeline"
          value={formatCurrency(company.totalPipeline)}
          accent
        />
      </div>

      <a
        href={`https://${company.website}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-cyan-400/80 hover:text-cyan-300 transition-colors lg:min-w-[140px] lg:text-right shrink-0"
      >
        {company.website}
      </a>
    </article>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="text-center lg:text-right">
      <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
      <p
        className={`text-sm font-semibold mt-0.5 ${accent ? "text-cyan-400" : "text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}
