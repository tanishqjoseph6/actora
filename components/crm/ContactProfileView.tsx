import Link from "next/link";
import { getAvatarGradient, getInitials } from "@/lib/avatar";
import { CrmBackLink } from "@/components/crm/CrmBackLink";
import { CrmSubNav } from "@/components/crm/CrmSubNav";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { formatDate } from "@/lib/crm/mock-data";
import { getAiScoreStyle } from "@/lib/crm/entities";
import type { Company, Contact, ContactStatus } from "@/lib/crm/types";

const STATUS_STYLES: Record<ContactStatus, string> = {
  active: "bg-emerald-500/15 border-emerald-400/25 text-emerald-400",
  lead: "bg-blue-500/15 border-blue-400/25 text-blue-300",
  inactive: "bg-gray-500/15 border-gray-400/25 text-gray-400",
};

type ContactProfileViewProps = {
  contact: Contact;
  company: Company | undefined;
};

export function ContactProfileView({
  contact,
  company,
}: ContactProfileViewProps) {
  const aiGradient = getAiScoreStyle(contact.aiLeadScore);

  return (
    <>
      <CrmBackLink href="/dashboard/crm/contacts" label="Back to contacts" />

      <div className="mb-6">
        <CrmSubNav />
      </div>

      <div className={`${dashboard.panelLg} mb-6`}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br ${getAvatarGradient(contact.name)} flex items-center justify-center text-xl sm:text-2xl font-bold text-white shrink-0 shadow-lg shadow-black/20`}
          >
            {getInitials(contact.name)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {contact.name}
              </h1>
              <span
                className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide border ${STATUS_STYLES[contact.status]}`}
              >
                {contact.status}
              </span>
            </div>
            <p className="text-gray-400 text-lg mb-3">{contact.title}</p>

            {company && (
              <Link
                href={`/dashboard/crm/companies/${company.id}`}
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium mb-4 group"
              >
                <BuildingIcon className="w-4 h-4" />
                {company.name}
                <ArrowIcon className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Link>
            )}

            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r ${aiGradient} border border-white/10`}
            >
              <SparkIcon className="w-4 h-4 text-white" />
              <span className="text-sm font-bold text-white">
                AI Lead Score · {contact.aiLeadScore}
              </span>
            </div>
          </div>
        </div>

        {contact.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-blue-400/10">
            {contact.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-lg bg-[#111827] border border-blue-400/15 text-xs text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className={`${dashboard.cardLg} p-5 sm:p-6`}>
          <h2 className="text-lg font-bold text-white mb-4">Contact info</h2>
          <dl className="space-y-4 text-sm">
            <Detail
              label="Email"
              value={
                <a
                  href={`mailto:${contact.email}`}
                  className="text-blue-400 hover:text-blue-300"
                >
                  {contact.email}
                </a>
              }
            />
            <Detail label="Phone" value={contact.phone} />
            <Detail label="Job title" value={contact.title} />
            <Detail label="Owner" value={contact.owner} />
            <Detail
              label="LinkedIn"
              value={
                <a
                  href={`https://${contact.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300"
                >
                  {contact.linkedin}
                </a>
              }
            />
            <Detail
              label="Last contacted"
              value={formatDate(contact.lastContacted)}
            />
          </dl>
        </section>

        <section className={`${dashboard.cardLg} p-5 sm:p-6`}>
          <h2 className="text-lg font-bold text-white mb-4">Notes</h2>
          <p className="text-sm text-gray-400 leading-relaxed">{contact.notes}</p>
        </section>
      </div>

      {company && (
        <section className={`mt-6 ${dashboard.cardLg} p-5 sm:p-6`}>
          <h2 className="text-lg font-bold text-white mb-4">Company</h2>
          <Link
            href={`/dashboard/crm/companies/${company.id}`}
            className="flex items-center gap-4 p-4 rounded-xl bg-[#111827]/50 border border-blue-400/10 hover:border-blue-400/30 transition-all group"
          >
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getAvatarGradient(company.name)} flex items-center justify-center text-sm font-bold text-white shrink-0`}
            >
              {getInitials(company.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                {company.name}
              </p>
              <p className="text-sm text-gray-400">{company.industry}</p>
            </div>
            <ArrowIcon className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors shrink-0" />
          </Link>
        </section>
      )}
    </>
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

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}
