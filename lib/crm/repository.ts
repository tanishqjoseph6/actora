import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  normalizeCrmCompany,
  normalizeCrmDeal,
  type CrmCompany,
  type CrmDeal,
} from "./entities-live";

const DEAL_SELECT =
  "id, user_id, title, company_id, contact_id, stage, value, probability, close_date, priority, owner, ai_score, labels, last_activity_at, created_at";

export async function fetchCompaniesWithStats(
  userId: string
): Promise<CrmCompany[]> {
  const db = getSupabaseAdmin();
  if (!db) return [];

  const { data: companies, error } = await db
    .from("crm_companies")
    .select(
      "id, user_id, name, industry, size, status, website, address, notes, revenue, employee_count, owner, ai_score, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !companies) return [];

  const [{ data: deals }, { data: contacts }] = await Promise.all([
    db.from("crm_deals").select("company_id, value, stage").eq("user_id", userId),
    db.from("crm_contacts").select("company_id").eq("user_id", userId),
  ]);

  const openStages = new Set(["lead", "qualified", "proposal", "negotiation"]);
  const statsByCompany = new Map<
    string,
    { openDeals: number; totalPipeline: number; contactCount: number }
  >();

  for (const deal of deals ?? []) {
    if (!deal.company_id) continue;
    const current = statsByCompany.get(deal.company_id) ?? {
      openDeals: 0,
      totalPipeline: 0,
      contactCount: 0,
    };
    if (openStages.has(deal.stage)) {
      current.openDeals += 1;
      current.totalPipeline += Number(deal.value ?? 0);
    }
    statsByCompany.set(deal.company_id, current);
  }

  for (const contact of contacts ?? []) {
    if (!contact.company_id) continue;
    const current = statsByCompany.get(contact.company_id) ?? {
      openDeals: 0,
      totalPipeline: 0,
      contactCount: 0,
    };
    current.contactCount += 1;
    statsByCompany.set(contact.company_id, current);
  }

  return companies.map((row) =>
    normalizeCrmCompany(row, statsByCompany.get(row.id))
  );
}

export async function fetchDealsEnriched(userId: string): Promise<CrmDeal[]> {
  const db = getSupabaseAdmin();
  if (!db) return [];

  const { data: deals, error } = await db
    .from("crm_deals")
    .select(DEAL_SELECT)
    .eq("user_id", userId)
    .order("last_activity_at", { ascending: false });

  if (error || !deals?.length) return [];

  const companyIds = [
    ...new Set(deals.map((d) => d.company_id).filter(Boolean)),
  ] as string[];
  const contactIds = [
    ...new Set(deals.map((d) => d.contact_id).filter(Boolean)),
  ] as string[];

  const companyNames = new Map<string, string>();
  const contactNames = new Map<string, string>();

  if (companyIds.length) {
    const { data: companies } = await db
      .from("crm_companies")
      .select("id, name")
      .in("id", companyIds);
    for (const c of companies ?? []) companyNames.set(c.id, c.name);
  }

  if (contactIds.length) {
    const { data: contacts } = await db
      .from("crm_contacts")
      .select("id, name, company_name")
      .in("id", contactIds);
    for (const c of contacts ?? []) {
      contactNames.set(c.id, c.name);
      if (c.company_name && !companyNames.has(c.id)) {
        // fallback company name from contact when deal has no company_id
      }
    }
  }

  // Also pull company_name from contacts for deals missing company join
  const { data: allContacts } = await db
    .from("crm_contacts")
    .select("id, name, company_name, company_id")
    .eq("user_id", userId);

  const contactCompanyName = new Map<string, string>();
  for (const c of allContacts ?? []) {
    contactCompanyName.set(c.id, c.company_name ?? "");
    if (c.company_id) companyNames.set(c.company_id, companyNames.get(c.company_id) ?? "");
  }

  return deals.map((row) => {
    let companyName = row.company_id
      ? (companyNames.get(row.company_id) ?? "")
      : "";
    if (!companyName && row.contact_id) {
      companyName = contactCompanyName.get(row.contact_id) ?? "";
    }
    return normalizeCrmDeal(row, {
      companyName,
      contactName: row.contact_id
        ? (contactNames.get(row.contact_id) ?? "")
        : "",
    });
  });
}

export async function countContactsByCompany(
  userId: string,
  companyId: string
): Promise<number> {
  const db = getSupabaseAdmin();
  if (!db) return 0;

  const { count } = await db
    .from("crm_contacts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("company_id", companyId);

  return count ?? 0;
}
