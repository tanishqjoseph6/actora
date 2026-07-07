export type CrmContactStatus = "active" | "lead" | "inactive";

export type CrmContact = {
  id: string;
  userId: string;
  name: string;
  email: string;
  companyName: string;
  status: CrmContactStatus;
  aiLeadScore: number;
  createdAt: string;
};

export type CrmContactInput = {
  name: string;
  email?: string;
  companyName?: string;
  status?: CrmContactStatus;
  aiLeadScore?: number;
};

export type CrmContactSort = "name-asc" | "name-desc" | "score-desc" | "newest";

export function normalizeCrmContact(row: {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  company_name: string | null;
  status: string;
  ai_lead_score: number | null;
  created_at: string;
}): CrmContact {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email ?? "",
    companyName: row.company_name ?? "",
    status: (row.status as CrmContactStatus) ?? "lead",
    aiLeadScore: row.ai_lead_score ?? 0,
    createdAt: row.created_at,
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
      c.companyName.toLowerCase().includes(q)
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
