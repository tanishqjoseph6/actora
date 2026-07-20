export type GlobalSearchCategory =
  | "Emails"
  | "Contacts"
  | "Companies"
  | "Deals"
  | "Tasks"
  | "Meetings"
  | "Automations";

export type GlobalSearchResult = {
  id: string;
  label: string;
  description: string;
  href: string;
  category: GlobalSearchCategory;
};

export function matchesSearchQuery(
  query: string,
  fields: (string | null | undefined)[]
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = fields
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function rankSearchResult(
  query: string,
  label: string,
  description: string
): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const labelLower = label.toLowerCase();
  const descLower = description.toLowerCase();
  if (labelLower === q) return 100;
  if (labelLower.startsWith(q)) return 80;
  if (labelLower.includes(q)) return 60;
  if (descLower.includes(q)) return 40;
  return 20;
}
