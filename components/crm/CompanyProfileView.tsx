import { getAvatarGradient, getInitials } from "@/lib/avatar";
import { CrmBackLink } from "@/components/crm/CrmBackLink";
import { ContactListItem } from "@/components/crm/ContactListItem";
import { CrmSubNav } from "@/components/crm/CrmSubNav";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import {
  formatCurrency,
  formatEmployeeCount,
  formatRevenue,
} from "@/lib/crm/mock-data";
import { getAiScoreStyle } from "@/lib/crm/entities";
import type { Company, Contact, CompanySize } from "@/lib/crm/types";

const SIZE_LABELS: Record<CompanySize, string> = {
  startup: "Startup",
  smb: "SMB",
  enterprise: "Enterprise",
};

type CompanyProfileViewProps = {
  company: Company;
  contacts: Contact[];
};

export function CompanyProfileView({
  company,
  contacts,
}: CompanyProfileViewProps) {
  const aiGradient = getAiScoreStyle(company.aiScore);

  return (
    <>
      <CrmBackLink href="/dashboard/crm/companies" label="Back to companies" />

      <div className="mb-6">
        <CrmSubNav />
      </div>

      <div className={`${dashboard.panelLg} mb-6`}>
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${getAvatarGradient(company.name)} flex items-center justify-center text-xl sm:text-2xl font-bold text-white shrink-0 border border-blue-400/20 shadow-lg shadow-black/20`}
          >
            {getInitials(company.name)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {company.name}
              </h1>
              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border border-blue-400/25 text-blue-300 bg-blue-500/10">
                {SIZE_LABELS[company.size]}
              </span>
              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs text-gray-400 border border-gray-400/20 bg-gray-500/10">
                {company.industry}
              </span>
              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs text-gray-400 border border-gray-400/20 bg-gray-500/10 capitalize">
                {company.status}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
              <a
                href={`https://${company.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                {company.website}
              </a>
              <span>Owner · {company.owner}</span>
            </div>

            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r ${aiGradient} border border-white/10`}
            >
              <SparkIcon className="w-4 h-4 text-white" />
              <span className="text-sm font-bold text-white">
                AI Score · {company.aiScore}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-blue-400/10">
          <Stat label="Annual revenue" value={formatRevenue(company.revenue)} />
          <Stat label="Employees" value={formatEmployeeCount(company.employeeCount)} />
          <Stat label="Open pipeline" value={formatCurrency(company.totalPipeline)} accent />
          <Stat label="Open deals" value={company.openDeals} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className={`${dashboard.cardLg} p-5 sm:p-6`}>
          <h2 className="text-lg font-bold text-white mb-4">Details</h2>
          <dl className="space-y-4 text-sm">
            <Detail label="Address" value={company.address} />
            <Detail
              label="Website"
              value={
                <a
                  href={`https://${company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300"
                >
                  {company.website}
                </a>
              }
            />
            <Detail label="Industry" value={company.industry} />
            <Detail label="Account owner" value={company.owner} />
          </dl>
        </section>

        <section className={`${dashboard.cardLg} p-5 sm:p-6`}>
          <h2 className="text-lg font-bold text-white mb-4">Notes</h2>
          <p className="text-sm text-gray-400 leading-relaxed">{company.notes}</p>
        </section>
      </div>

      <section className={`mt-6 ${dashboard.cardLg} p-5 sm:p-6`}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-white">
            Contacts
            <span className="ml-2 text-sm font-normal text-gray-500">
              {contacts.length}
            </span>
          </h2>
        </div>

        {contacts.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">
            No contacts linked to this company.
          </p>
        ) : (
          <div className="space-y-2">
            {contacts.map((contact) => (
              <ContactListItem key={contact.id} contact={contact} compact />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl bg-[#111111]/50 border border-blue-400/10 p-3 sm:p-4">
      <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
      <p
        className={`text-lg sm:text-xl font-bold mt-1 ${accent ? "text-white" : "text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-gray-500 text-xs uppercase tracking-wider mb-1">
        {label}
      </dt>
      <dd className="text-gray-300">{value}</dd>
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
