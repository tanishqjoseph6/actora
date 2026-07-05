"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";
import { getAvatarGradient, getInitials } from "@/lib/avatar";
import { formatDate } from "@/lib/crm/mock-data";
import type { Contact, ContactStatus } from "@/lib/crm/types";

const STATUS_STYLES: Record<ContactStatus, string> = {
  active: "bg-[#2563EB]/15 border-[#2563EB]/35 text-[#93C5FD]",
  lead: "bg-[#1E293B] border-[#334155] text-[#94A3B8]",
  inactive: "bg-[#0B1220] border-[#1E293B] text-[#64748B]",
};

function aiScoreBadge(score: number): string {
  if (score >= 80) return "bg-[#2563EB]/20 border-[#3B82F6]/40 text-[#93C5FD]";
  if (score >= 60) return "bg-[#1E293B] border-[#334155] text-[#94A3B8]";
  return "bg-[#0B1220] border-[#1E293B] text-[#64748B]";
}

type ContactsTableProps = {
  contacts: Contact[];
};

export function ContactsTable({ contacts }: ContactsTableProps) {
  return (
    <div className="overflow-x-auto -mx-1 px-1 premium-scrollbar">
      <table className="w-full min-w-[880px] border-collapse">
        <thead>
          <tr className="border-b border-[#1E293B]">
            <Th>Contact</Th>
            <Th>Company</Th>
            <Th className="hidden md:table-cell">Email</Th>
            <Th>Status</Th>
            <Th className="hidden lg:table-cell">Owner</Th>
            <Th className="hidden sm:table-cell">Last contact</Th>
            <Th align="right">AI score</Th>
            <Th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <ContactRow key={contact.id} contact={contact} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContactRow({ contact }: { contact: Contact }) {
  return (
    <tr className="group border-b border-[#1E293B] last:border-b-0 hover:bg-[#0B1220]/80 transition-colors">
      <td className="py-3.5 pr-4">
        <Link
          href={`/dashboard/crm/contacts/${contact.id}`}
          className="flex items-center gap-3 min-w-0"
        >
          <div
            className={`w-9 h-9 rounded-lg bg-gradient-to-br ${getAvatarGradient(contact.name)} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}
          >
            {getInitials(contact.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate group-hover:text-[#93C5FD] transition-colors">
              {contact.name}
            </p>
            <p className="text-xs text-[#64748B] truncate">{contact.title}</p>
          </div>
        </Link>
      </td>

      <td className="py-3.5 pr-4">
        <Link
          href={`/dashboard/crm/companies/${contact.companyId}`}
          className="text-sm text-[#94A3B8] hover:text-[#3B82F6] transition-colors truncate block max-w-[160px]"
        >
          {contact.companyName}
        </Link>
      </td>

      <td className="py-3.5 pr-4 hidden md:table-cell">
        <span className="text-sm text-[#94A3B8] truncate block max-w-[200px]">
          {contact.email}
        </span>
      </td>

      <td className="py-3.5 pr-4">
        <span
          className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide border ${STATUS_STYLES[contact.status]}`}
        >
          {contact.status}
        </span>
      </td>

      <td className="py-3.5 pr-4 hidden lg:table-cell">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-[#2563EB] flex items-center justify-center text-[8px] font-bold text-white shrink-0">
            {getInitials(contact.owner)}
          </span>
          <span className="text-sm text-[#94A3B8] truncate">{contact.owner}</span>
        </div>
      </td>

      <td className="py-3.5 pr-4 hidden sm:table-cell">
        <span className="text-sm text-[#64748B] tabular-nums">
          {formatDate(contact.lastContacted)}
        </span>
      </td>

      <td className="py-3.5 pr-4 text-right">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-semibold tabular-nums ${aiScoreBadge(contact.aiLeadScore)}`}
        >
          <SparkIcon className="w-3 h-3 opacity-80" />
          {contact.aiLeadScore}
        </span>
      </td>

      <td className="py-3.5">
        <Link
          href={`/dashboard/crm/contacts/${contact.id}`}
          className="inline-flex p-1.5 rounded-lg text-[#64748B] hover:text-white hover:bg-[#1E293B] transition-colors"
          aria-label={`View ${contact.name}`}
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      </td>
    </tr>
  );
}

function Th({
  children,
  align = "left",
  className = "",
}: {
  children?: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={`
        py-3 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]
        ${align === "right" ? "text-right" : "text-left"}
        ${className}
      `}
    >
      {children}
    </th>
  );
}

export function ContactsTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="overflow-hidden" aria-busy="true" aria-label="Loading contacts">
      <div className="border-b border-[#1E293B] py-3 flex gap-6 px-1">
        {["Contact", "Company", "Status", "Score"].map((h) => (
          <Skeleton key={h} className="h-3 w-16" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 py-4 border-b border-[#1E293B]"
        >
          <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-28 hidden sm:block" />
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-5 w-10" />
        </div>
      ))}
    </div>
  );
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
