import type { DealStage, CompanySize, CompanyStatus } from "./types";
import type { DealPriority, PipelineDeal } from "./pipeline";
import { formatRelativeTime } from "./auth";

export type CrmContactStatus = "active" | "lead" | "inactive";

export type CrmContact = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  title: string;
  companyId: string | null;
  companyName: string;
  owner: string;
  status: CrmContactStatus;
  aiLeadScore: number;
  createdAt: string;
  updatedAt: string;
};

export type CrmContactInput = {
  name: string;
  email?: string;
  phone?: string;
  title?: string;
  companyId?: string | null;
  companyName?: string;
  owner?: string;
  status?: CrmContactStatus;
  aiLeadScore?: number;
};

export type CrmCompany = {
  id: string;
  userId: string;
  name: string;
  industry: string;
  size: CompanySize;
  status: CompanyStatus;
  website: string;
  address: string;
  notes: string;
  revenue: number;
  employeeCount: number;
  owner: string;
  aiScore: number;
  openDeals: number;
  totalPipeline: number;
  contactCount: number;
  createdAt: string;
};

export type CrmCompanyInput = {
  name: string;
  industry?: string;
  size?: CompanySize;
  status?: CompanyStatus;
  website?: string;
  address?: string;
  notes?: string;
  revenue?: number;
  employeeCount?: number;
  owner?: string;
  aiScore?: number;
};

export type CrmDeal = {
  id: string;
  userId: string;
  title: string;
  companyId: string | null;
  companyName: string;
  contactId: string | null;
  contactName: string;
  stage: DealStage;
  value: number;
  probability: number;
  closeDate: string;
  priority: DealPriority;
  owner: string;
  aiScore: number;
  labels: string[];
  lastActivityAt: string;
  createdAt: string;
};

export type CrmDealInput = {
  title: string;
  companyId?: string | null;
  contactId?: string | null;
  stage?: DealStage;
  value?: number;
  probability?: number;
  closeDate?: string;
  priority?: DealPriority;
  owner?: string;
  aiScore?: number;
  labels?: string[];
};

export type CrmNote = {
  id: string;
  contactId: string | null;
  dealId: string | null;
  body: string;
  createdAt: string;
};

export type CrmActivity = {
  id: string;
  contactId: string | null;
  dealId: string | null;
  type: "email" | "note" | "meeting" | "deal_stage" | "call" | "task" | "deal_created";
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type CrmEmailLink = {
  id: string;
  gmailMessageId: string;
  contactId: string;
  dealId: string | null;
  subject: string;
  senderEmail: string;
  senderName: string;
  snippet: string;
  linkedAt: string;
};

export type CrmContactSort = "name-asc" | "name-desc" | "score-desc" | "newest";

const CONTACT_SELECT =
  "id, user_id, name, email, phone, title, company_id, company_name, owner, status, ai_lead_score, created_at, updated_at";

export { CONTACT_SELECT };

export function normalizeCrmContact(row: {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  company_id?: string | null;
  company_name: string | null;
  phone?: string | null;
  title?: string | null;
  owner?: string | null;
  status: string;
  ai_lead_score: number | null;
  created_at: string;
  updated_at?: string | null;
}): CrmContact {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    title: row.title ?? "",
    companyId: row.company_id ?? null,
    companyName: row.company_name ?? "",
    owner: row.owner ?? "",
    status: (row.status as CrmContactStatus) ?? "lead",
    aiLeadScore: row.ai_lead_score ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

export function normalizeCrmCompany(
  row: {
    id: string;
    user_id: string;
    name: string;
    industry: string | null;
    size: string;
    status: string;
    website: string | null;
    address: string | null;
    notes: string | null;
    revenue: number | null;
    employee_count: number | null;
    owner: string | null;
    ai_score: number | null;
    created_at: string;
  },
  stats?: { openDeals: number; totalPipeline: number; contactCount?: number }
): CrmCompany {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    industry: row.industry ?? "",
    size: (row.size as CompanySize) ?? "smb",
    status: (row.status as CompanyStatus) ?? "active",
    website: row.website ?? "",
    address: row.address ?? "",
    notes: row.notes ?? "",
    revenue: Number(row.revenue ?? 0),
    employeeCount: row.employee_count ?? 0,
    owner: row.owner ?? "",
    aiScore: row.ai_score ?? 0,
    openDeals: stats?.openDeals ?? 0,
    totalPipeline: stats?.totalPipeline ?? 0,
    contactCount: stats?.contactCount ?? 0,
    createdAt: row.created_at,
  };
}

export function normalizeCrmDeal(
  row: {
    id: string;
    user_id: string;
    title: string;
    company_id: string | null;
    contact_id: string | null;
    stage: string;
    value: number | string | null;
    probability: number | null;
    close_date: string | null;
    priority: string;
    owner: string | null;
    ai_score: number | null;
    labels: string[] | null;
    last_activity_at: string;
    created_at: string;
  },
  joins?: { companyName?: string; contactName?: string }
): CrmDeal {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    companyId: row.company_id,
    companyName: joins?.companyName ?? "",
    contactId: row.contact_id,
    contactName: joins?.contactName ?? "",
    stage: row.stage as DealStage,
    value: Number(row.value ?? 0),
    probability: row.probability ?? 0,
    closeDate: row.close_date ?? "",
    priority: (row.priority as DealPriority) ?? "medium",
    owner: row.owner ?? "",
    aiScore: row.ai_score ?? 0,
    labels: row.labels ?? [],
    lastActivityAt: row.last_activity_at,
    createdAt: row.created_at,
  };
}

export function toPipelineDeal(deal: CrmDeal): PipelineDeal {
  return {
    id: deal.id,
    title: deal.title,
    companyId: deal.companyId ?? "",
    companyName: deal.companyName || "Unknown",
    contactName: deal.contactName || "—",
    stage: deal.stage,
    value: deal.value,
    closeDate: deal.closeDate || new Date().toISOString().slice(0, 10),
    priority: deal.priority,
    owner: deal.owner || "Unassigned",
    lastActivity: formatRelativeTime(deal.lastActivityAt),
    aiScore: deal.aiScore,
    labels: deal.labels,
  };
}

export function filterAndSortContacts(
  contacts: CrmContact[],
  opts: {
    search: string;
    status: "all" | CrmContactStatus;
    company: string;
    sort: CrmContactSort;
  }
): CrmContact[] {
  const q = opts.search.trim().toLowerCase();
  const filtered = contacts.filter((c) => {
    if (opts.status !== "all" && c.status !== opts.status) return false;
    if (opts.company !== "all" && c.companyName !== opts.company) return false;
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.companyName.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q)
    );
  });

  return filtered.sort((a, b) => {
    switch (opts.sort) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "score-desc":
        return b.aiLeadScore - a.aiLeadScore;
      case "newest":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });
}

export function filterCompanies(
  companies: CrmCompany[],
  opts: {
    search: string;
    size: "all" | CompanySize;
    industry: string;
    owner: string;
    status: string;
  }
): CrmCompany[] {
  const q = opts.search.trim().toLowerCase();
  return companies.filter((c) => {
    if (opts.size !== "all" && c.size !== opts.size) return false;
    if (opts.industry !== "all" && c.industry !== opts.industry) return false;
    if (opts.owner !== "all" && c.owner !== opts.owner) return false;
    if (opts.status !== "all" && c.status !== opts.status) return false;
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.industry.toLowerCase().includes(q) ||
      c.website.toLowerCase().includes(q)
    );
  });
}

export type CompanySort =
  | "name-asc"
  | "name-desc"
  | "revenue-desc"
  | "revenue-asc"
  | "employees-desc"
  | "ai-score-desc"
  | "pipeline-desc";

export function sortCompanies(
  companies: CrmCompany[],
  sort: CompanySort
): CrmCompany[] {
  return [...companies].sort((a, b) => {
    switch (sort) {
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "revenue-desc":
        return b.revenue - a.revenue;
      case "revenue-asc":
        return a.revenue - b.revenue;
      case "employees-desc":
        return b.employeeCount - a.employeeCount;
      case "ai-score-desc":
        return b.aiScore - a.aiScore;
      case "pipeline-desc":
        return b.totalPipeline - a.totalPipeline;
      case "name-asc":
      default:
        return a.name.localeCompare(b.name);
    }
  });
}

export function filterDeals(
  deals: CrmDeal[],
  opts: {
    search: string;
    stage?: string;
    owner?: string;
    companyId?: string;
  }
): CrmDeal[] {
  const q = opts.search.trim().toLowerCase();
  return deals.filter((d) => {
    if (opts.stage && opts.stage !== "all" && d.stage !== opts.stage) return false;
    if (opts.owner && opts.owner !== "all" && d.owner !== opts.owner) return false;
    if (opts.companyId && opts.companyId !== "all" && d.companyId !== opts.companyId)
      return false;
    if (!q) return true;
    return (
      d.title.toLowerCase().includes(q) ||
      d.companyName.toLowerCase().includes(q) ||
      d.contactName.toLowerCase().includes(q) ||
      d.owner.toLowerCase().includes(q)
    );
  });
}
