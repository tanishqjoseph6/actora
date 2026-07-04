import Link from "next/link";
import { getAvatarGradient, getInitials } from "@/lib/avatar";
import {
  formatCurrency,
  formatEmployeeCount,
  formatRevenue,
} from "@/lib/crm/mock-data";
import { getAiScoreStyle, getContactCountForCompany } from "@/lib/crm/entities";
import type { Company, CompanySize, CompanyStatus } from "@/lib/crm/types";

const SIZE_LABELS: Record<CompanySize, string> = {
  startup: "Startup",
  smb: "SMB",
  enterprise: "Enterprise",
};

const SIZE_STYLES: Record<CompanySize, string> = {
  startup: "bg-violet-500/15 border-violet-400/25 text-violet-300",
  smb: "bg-blue-500/15 border-blue-400/25 text-blue-300",
  enterprise: "bg-amber-500/15 border-amber-400/25 text-amber-300",
};

const STATUS_LABELS: Record<CompanyStatus, string> = {
  active: "Active",
  prospect: "Prospect",
  churned: "Churned",
};

const STATUS_STYLES: Record<CompanyStatus, string> = {
  active: "bg-emerald-500/15 border-emerald-400/25 text-emerald-400",
  prospect: "bg-blue-500/15 border-blue-400/25 text-blue-300",
  churned: "bg-gray-500/15 border-gray-400/25 text-gray-400",
};

export function CompanyListItem({ company }: { company: Company }) {
  const contactsCount = getContactCountForCompany(company.id);
  const aiGradient = getAiScoreStyle(company.aiScore);
  const addressLine = company.address.split(",")[0];

  return (
    <Link href={`/dashboard/crm/companies/${company.id}`} className="block group">
      <article className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 sm:p-5 rounded-2xl bg-[#111827]/40 border border-blue-400/10 hover:border-blue-400/30 hover:bg-[#111827]/70 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/5">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div
            className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getAvatarGradient(company.name)} flex items-center justify-center text-sm font-bold text-white shrink-0 border border-blue-400/20`}
          >
            {getInitials(company.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                {company.name}
              </h3>
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${SIZE_STYLES[company.size]}`}
            >
              {SIZE_LABELS[company.size]}
            </span>
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${STATUS_STYLES[company.status]}`}
            >
              {STATUS_LABELS[company.status]}
            </span>
            </div>
            <p className="text-sm text-gray-400">{company.industry}</p>
            <p className="text-sm text-gray-500 mt-0.5 truncate">{addressLine}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4 lg:min-w-[360px] shrink-0">
          <Metric label="Revenue" value={formatRevenue(company.revenue)} />
          <Metric label="Employees" value={formatEmployeeCount(company.employeeCount)} />
          <Metric label="Contacts" value={contactsCount} />
          <Metric
            label="Pipeline"
            value={formatCurrency(company.totalPipeline)}
            accent
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r ${aiGradient}`}
            title="AI company score"
          >
            <SparkIcon className="w-3 h-3 text-white" />
            <span className="text-xs font-bold text-white">{company.aiScore}</span>
          </div>
          <span className="text-xs text-gray-500 hidden sm:inline">{company.owner}</span>
        </div>
      </article>
    </Link>
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
    <div>
      <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
      <p
        className={`text-sm font-semibold mt-0.5 ${accent ? "text-blue-400" : "text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}
