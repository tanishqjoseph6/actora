import { getAvatarGradient, getInitials } from "@/lib/avatar";
import { formatDate } from "@/lib/crm/mock-data";
import type { Contact, ContactStatus } from "@/lib/crm/types";

const STATUS_STYLES: Record<ContactStatus, string> = {
  active: "bg-emerald-500/15 border-emerald-400/25 text-emerald-400",
  lead: "bg-blue-500/15 border-blue-400/25 text-blue-300",
  inactive: "bg-gray-500/15 border-gray-400/25 text-gray-400",
};

export function ContactListItem({ contact }: { contact: Contact }) {
  return (
    <article className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 rounded-2xl bg-[#0d1730]/40 border border-cyan-400/10 hover:border-cyan-400/25 hover:bg-[#0d1730]/70 transition-all duration-200">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div
          className={`w-11 h-11 rounded-full bg-gradient-to-br ${getAvatarGradient(contact.name)} flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-lg shadow-black/20`}
        >
          {getInitials(contact.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-white truncate">{contact.name}</h3>
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${STATUS_STYLES[contact.status]}`}
            >
              {contact.status}
            </span>
          </div>
          <p className="text-sm text-gray-400 truncate">{contact.title}</p>
          <p className="text-sm text-cyan-400/80 truncate mt-0.5">
            {contact.companyName}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:items-end gap-1.5 sm:min-w-[180px] shrink-0">
        <a
          href={`mailto:${contact.email}`}
          className="text-sm text-gray-300 hover:text-cyan-400 transition-colors truncate max-w-full"
        >
          {contact.email}
        </a>
        <p className="text-xs text-gray-500">{contact.phone}</p>
        <p className="text-xs text-gray-500">
          Last contact · {formatDate(contact.lastContacted)}
        </p>
      </div>

      {contact.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 sm:max-w-[160px] sm:justify-end">
          {contact.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-md bg-[#081226] border border-cyan-400/10 text-[10px] text-gray-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
