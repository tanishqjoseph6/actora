import Link from "next/link";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { getAvatarGradient, getInitials } from "@/lib/avatar";
import { getAiScoreStyle } from "@/lib/crm/entities";
import type { CrmContactStatus } from "@/lib/crm/live";

const STATUS_STYLES: Record<CrmContactStatus, string> = {
  active: "bg-[#3B82F6]/15 border-[#3B82F6]/35 text-[#93C5FD]",
  lead: "bg-[#1E293B] border-[#334155] text-[#A1A1AA]",
  inactive: "bg-[#0A0A0A] border-white/[0.06] text-[#71717A]",
};

type ContactListItemProps = {
  contact: {
    id: string;
    name: string;
    email: string;
    companyName: string;
    status: CrmContactStatus;
    aiLeadScore: number;
  };
  compact?: boolean;
  onEdit?: (contact: ContactListItemProps["contact"]) => void;
  onDelete?: (contact: ContactListItemProps["contact"]) => void;
};

export function ContactListItem({
  contact,
  compact,
  onEdit,
  onDelete,
}: ContactListItemProps) {
  const aiGradient = getAiScoreStyle(contact.aiLeadScore);

  return (
    <article
      className={`flex flex-col gap-4 rounded-xl ${dashboard.cardInteractive} ${
        compact ? "p-3" : "p-4 sm:p-5"
      }`}
    >
      <Link href={`/dashboard/crm/contacts/${contact.id}`} className="block group">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div
            className={`${compact ? "w-9 h-9 text-xs" : "w-11 h-11 text-sm"} rounded-full bg-gradient-to-br ${getAvatarGradient(contact.name)} flex items-center justify-center font-bold text-white shrink-0 shadow-lg shadow-black/20`}
          >
            {getInitials(contact.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <h3 className="font-semibold text-white truncate group-hover:text-[#93C5FD] transition-colors">
                {contact.name}
              </h3>
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${STATUS_STYLES[contact.status]}`}
              >
                {contact.status}
              </span>
            </div>
            <p className="text-sm text-[#71717A] truncate">
              {contact.companyName || "No company"}
            </p>
            <p className="text-xs text-[#3B82F6] truncate mt-0.5">
              {contact.email || "No email"}
            </p>
          </div>
        </div>
      </Link>

      <div className="flex items-center justify-between gap-2">
        <div
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r ${aiGradient} shrink-0`}
          title="AI lead score"
        >
          <SparkIcon className="w-3 h-3 text-white" />
          <span className="text-xs font-bold text-white">{contact.aiLeadScore}</span>
        </div>
        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(contact)}
              className="px-2 py-1 rounded-md text-xs bg-[#1E293B] text-[#BFDBFE]"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(contact)}
              className="px-2 py-1 rounded-md text-xs bg-[#1E293B] text-[#FCA5A5]"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}
