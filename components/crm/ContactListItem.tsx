import Link from "next/link";
import { getAvatarGradient, getInitials } from "@/lib/avatar";
import { formatDate } from "@/lib/crm/mock-data";
import { getAiScoreStyle } from "@/lib/crm/entities";
import type { Contact, ContactStatus } from "@/lib/crm/types";

const STATUS_STYLES: Record<ContactStatus, string> = {
  active: "bg-emerald-500/15 border-emerald-400/25 text-emerald-400",
  lead: "bg-blue-500/15 border-blue-400/25 text-blue-300",
  inactive: "bg-gray-500/15 border-gray-400/25 text-gray-400",
};

type ContactListItemProps = {
  contact: Contact;
  compact?: boolean;
};

export function ContactListItem({ contact, compact }: ContactListItemProps) {
  const aiGradient = getAiScoreStyle(contact.aiLeadScore);

  return (
    <Link
      href={`/dashboard/crm/contacts/${contact.id}`}
      className="block group"
    >
      <article
        className={`flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl bg-[#111827]/40 border border-blue-400/10 hover:border-blue-400/30 hover:bg-[#111827]/70 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/5 ${compact ? "p-3" : "p-4 sm:p-5"}`}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div
            className={`${compact ? "w-9 h-9 text-xs" : "w-11 h-11 text-sm"} rounded-full bg-gradient-to-br ${getAvatarGradient(contact.name)} flex items-center justify-center font-bold text-white shrink-0 shadow-lg shadow-black/20`}
          >
            {getInitials(contact.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <h3 className="font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                {contact.name}
              </h3>
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${STATUS_STYLES[contact.status]}`}
              >
                {contact.status}
              </span>
            </div>
            <p className="text-sm text-gray-400 truncate">{contact.title}</p>
            {!compact && (
              <p className="text-sm text-blue-400/80 truncate mt-0.5">
                {contact.companyName}
              </p>
            )}
          </div>
        </div>

        {!compact && (
          <>
            <div className="flex flex-col sm:items-end gap-1.5 sm:min-w-[160px] shrink-0">
              <span className="text-sm text-gray-300 truncate max-w-full">
                {contact.email}
              </span>
              <p className="text-xs text-gray-500">{contact.phone}</p>
              <p className="text-xs text-gray-500">Owner · {contact.owner}</p>
              <p className="text-xs text-gray-500">
                Last contact · {formatDate(contact.lastContacted)}
              </p>
            </div>

            <div
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r ${aiGradient} shrink-0 self-start sm:self-center`}
              title="AI lead score"
            >
              <SparkIcon className="w-3 h-3 text-white" />
              <span className="text-xs font-bold text-white">
                {contact.aiLeadScore}
              </span>
            </div>
          </>
        )}

        {compact && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-500">{contact.title}</span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gradient-to-r ${aiGradient}`}
            >
              <span className="text-[10px] font-bold text-white">
                {contact.aiLeadScore}
              </span>
            </span>
          </div>
        )}
      </article>
    </Link>
  );
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}
