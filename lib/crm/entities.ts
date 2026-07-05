import {
  MOCK_COMPANIES,
  MOCK_CONTACTS,
} from "./mock-data";
import type {
  Company,
  CompanySort,
  CompanyStatus,
  Contact,
  ContactSort,
  ContactStatus,
  CompanySize,
} from "./types";

export function getCompanyById(id: string): Company | undefined {
  return MOCK_COMPANIES.find((c) => c.id === id);
}

export function getContactById(id: string): Contact | undefined {
  return MOCK_CONTACTS.find((c) => c.id === id);
}

export function getContactsByCompanyId(companyId: string): Contact[] {
  return MOCK_CONTACTS.filter((c) => c.companyId === companyId);
}

export function getCompanyForContact(contact: Contact): Company | undefined {
  return getCompanyById(contact.companyId);
}

export function getContactCountForCompany(companyId: string): number {
  return getContactsByCompanyId(companyId).length;
}

export const CRM_OWNERS = [
  "all",
  ...Array.from(new Set(MOCK_COMPANIES.map((c) => c.owner))),
] as const;

export const CRM_INDUSTRIES = [
  "all",
  ...Array.from(new Set(MOCK_COMPANIES.map((c) => c.industry))),
] as const;

export function getAiScoreStyle(score: number): string {
  if (score >= 80) return "from-[#2563EB] to-[#1D4ED8]";
  if (score >= 60) return "from-[#3B82F6] to-[#2563EB]";
  if (score >= 40) return "from-[#64748B] to-[#475569]";
  return "from-[#475569] to-[#334155]";
}

export function sortCompanies(
  companies: Company[],
  sort: CompanySort
): Company[] {
  const list = [...companies];
  switch (sort) {
    case "name-asc":
      return list.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":
      return list.sort((a, b) => b.name.localeCompare(a.name));
    case "revenue-desc":
      return list.sort((a, b) => b.revenue - a.revenue);
    case "revenue-asc":
      return list.sort((a, b) => a.revenue - b.revenue);
    case "employees-desc":
      return list.sort((a, b) => b.employeeCount - a.employeeCount);
    case "ai-score-desc":
      return list.sort((a, b) => b.aiScore - a.aiScore);
    case "pipeline-desc":
      return list.sort((a, b) => b.totalPipeline - a.totalPipeline);
    default:
      return list;
  }
}

export function sortContacts(
  contacts: Contact[],
  sort: ContactSort
): Contact[] {
  const list = [...contacts];
  switch (sort) {
    case "name-asc":
      return list.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":
      return list.sort((a, b) => b.name.localeCompare(a.name));
    case "last-contacted":
      return list.sort(
        (a, b) =>
          new Date(b.lastContacted).getTime() -
          new Date(a.lastContacted).getTime()
      );
    case "ai-score-desc":
      return list.sort((a, b) => b.aiLeadScore - a.aiLeadScore);
    default:
      return list;
  }
}

export function filterCompanies(
  companies: Company[],
  opts: {
    search: string;
    size: string;
    industry: string;
    owner: string;
    status?: string;
  }
): Company[] {
  const q = opts.search.trim().toLowerCase();
  return companies.filter((c) => {
    if (opts.size !== "all" && c.size !== (opts.size as CompanySize))
      return false;
    if (opts.industry !== "all" && c.industry !== opts.industry) return false;
    if (opts.owner !== "all" && c.owner !== opts.owner) return false;
    if (opts.status && opts.status !== "all" && c.status !== (opts.status as CompanyStatus))
      return false;
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.industry.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      c.website.toLowerCase().includes(q) ||
      c.owner.toLowerCase().includes(q) ||
      c.notes.toLowerCase().includes(q)
    );
  });
}

export function filterContacts(
  contacts: Contact[],
  opts: {
    search: string;
    status: string;
    companyId: string;
    owner?: string;
  }
): Contact[] {
  const q = opts.search.trim().toLowerCase();
  return contacts.filter((c) => {
    if (opts.status !== "all" && c.status !== (opts.status as ContactStatus))
      return false;
    if (opts.companyId !== "all" && c.companyId !== opts.companyId)
      return false;
    if (opts.owner && opts.owner !== "all" && c.owner !== opts.owner)
      return false;
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.companyName.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.owner.toLowerCase().includes(q) ||
      c.notes.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
}
