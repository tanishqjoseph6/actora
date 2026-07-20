import { CrmBackLink } from "@/components/crm/CrmBackLink";
import { CrmSubNav } from "@/components/crm/CrmSubNav";
import { ContactMeetingsSection } from "@/components/crm/ContactMeetingsSection";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { getAiScoreStyle } from "@/lib/crm/entities";
import type { CrmContact, CrmContactStatus } from "@/lib/crm/live";

const STATUS_STYLES: Record<CrmContactStatus, string> = {
  active: "bg-emerald-500/15 border-emerald-400/25 text-emerald-400",
  lead: "bg-blue-500/15 border-blue-400/25 text-blue-300",
  inactive: "bg-gray-500/15 border-gray-400/25 text-gray-400",
};

export function ContactProfileView({ contact }: { contact: CrmContact }) {
  const aiGradient = getAiScoreStyle(contact.aiLeadScore);

  return (
    <>
      <CrmBackLink href="/dashboard/crm/contacts" label="Back to contacts" />
      <div className="mb-6">
        <CrmSubNav />
      </div>
      <div className={`${dashboard.panelLg} mb-6`}>
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{contact.name}</h1>
          <span
            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide border ${STATUS_STYLES[contact.status]}`}
          >
            {contact.status}
          </span>
        </div>
        <p className="text-gray-400 mb-2">{contact.companyName || "No company"}</p>
        <p className="text-[#93C5FD] mb-4">{contact.email || "No email"}</p>
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r ${aiGradient} border border-white/10`}
        >
          <span className="text-sm font-bold text-white">
            AI Lead Score · {contact.aiLeadScore}
          </span>
        </div>
      </div>

      <section className={`${dashboard.cardLg} p-5 sm:p-6`}>
        <h2 className="text-lg font-bold text-white mb-4">Contact details</h2>
        <dl className="space-y-4 text-sm">
          <Detail label="Name" value={contact.name} />
          <Detail label="Email" value={contact.email || "—"} />
          <Detail label="Company" value={contact.companyName || "—"} />
          <Detail label="Status" value={contact.status} />
          <Detail
            label="Created"
            value={new Date(contact.createdAt).toLocaleString()}
          />
        </dl>
      </section>

      <ContactMeetingsSection contactEmail={contact.email} />
    </>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-gray-500 text-xs uppercase tracking-wider mb-1">{label}</dt>
      <dd className="text-gray-300">{value}</dd>
    </div>
  );
}
