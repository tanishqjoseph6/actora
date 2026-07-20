import { NextRequest } from "next/server";
import { getGmailAuthClient } from "@/lib/gmail-auth";
import { searchInboxEmails } from "@/lib/gmail";
import { automationRepository } from "@/lib/automations/repository";
import { listStoredCalendarEvents } from "@/lib/calendar/meetings-store";
import { fetchCompaniesWithStats, fetchDealsEnriched } from "@/lib/crm/repository";
import { mapTaskRow, TASK_SELECT } from "@/lib/tasks/live";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";
import {
  matchesSearchQuery,
  rankSearchResult,
  type GlobalSearchCategory,
  type GlobalSearchResult,
} from "./types";

const PER_CATEGORY_LIMIT = 5;
const TOTAL_LIMIT = 12;

function sanitizeIlikeQuery(query: string): string {
  return query.replace(/[%_\\]/g, "").trim();
}

type RankedResult = GlobalSearchResult & { rank: number };

export async function runGlobalSearch(
  userId: string,
  query: string,
  request?: NextRequest
): Promise<GlobalSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const ranked: RankedResult[] = [];
  const normalizedUserId = normalizeSubscriptionUserId(userId);
  const ilike = `%${sanitizeIlikeQuery(q)}%`;

  const push = (result: GlobalSearchResult) => {
    ranked.push({
      ...result,
      rank: rankSearchResult(q, result.label, result.description),
    });
  };

  const countCategory = (category: GlobalSearchCategory) =>
    ranked.filter((item) => item.category === category).length;

  // Emails (Gmail API)
  if (request) {
    try {
      const auth = await getGmailAuthClient(request);
      if (auth.ok) {
        const emails = await searchInboxEmails(auth.oauth2Client, q, PER_CATEGORY_LIMIT);
        for (const email of emails) {
          push({
            id: `email-${email.id}`,
            label: email.subject,
            description: `${email.sender} · ${email.preview.slice(0, 80)}`,
            href: "/dashboard/inbox",
            category: "Emails",
          });
        }
      }
    } catch (error) {
      console.warn("[search] Gmail search skipped:", error);
    }
  }

  const db = getSupabaseAdmin();

  // Contacts
  if (db) {
    const { data: contacts } = await db
      .from("crm_contacts")
      .select("id, name, email, company_name, status")
      .eq("user_id", userId)
      .or(
        `name.ilike.${ilike},email.ilike.${ilike},company_name.ilike.${ilike}`
      )
      .limit(PER_CATEGORY_LIMIT);

    for (const contact of contacts ?? []) {
      push({
        id: `contact-${contact.id}`,
        label: contact.name,
        description: [contact.email, contact.company_name, contact.status]
          .filter(Boolean)
          .join(" · "),
        href: `/dashboard/crm/contacts/${contact.id}`,
        category: "Contacts",
      });
    }

    // Tasks
    const { data: tasks } = await db
      .from("tasks")
      .select(TASK_SELECT)
      .eq("user_id", userId)
      .or(
        `title.ilike.${ilike},description.ilike.${ilike},company_name.ilike.${ilike}`
      )
      .limit(PER_CATEGORY_LIMIT);

    for (const row of tasks ?? []) {
      const task = mapTaskRow(row);
      push({
        id: `task-${task.id}`,
        label: task.title,
        description: [task.status, task.companyName, task.dueDate]
          .filter(Boolean)
          .join(" · "),
        href: "/dashboard/tasks",
        category: "Tasks",
      });
    }

    // Meetings (stored)
    const { data: meetings } = await db
      .from("meetings")
      .select("id, title, starts_at, status")
      .eq("user_id", userId)
      .ilike("title", ilike)
      .limit(PER_CATEGORY_LIMIT);

    for (const meeting of meetings ?? []) {
      push({
        id: `meeting-${meeting.id}`,
        label: meeting.title,
        description: `Meeting · ${meeting.status ?? "scheduled"}`,
        href: "/dashboard/calendar",
        category: "Meetings",
      });
    }
  }

  // Calendar-synced events
  try {
    const events = await listStoredCalendarEvents(normalizedUserId);
    for (const event of events) {
      if (!matchesSearchQuery(q, [event.title, event.description, event.location])) {
        continue;
      }
      push({
        id: `calendar-${event.id}`,
        label: event.title,
        description: `Calendar · ${new Date(event.startAt).toLocaleString()}`,
        href: "/dashboard/calendar",
        category: "Meetings",
      });
      if (countCategory("Meetings") >= PER_CATEGORY_LIMIT) {
        break;
      }
    }
  } catch {
    // Calendar optional
  }

  // Companies (live CRM)
  try {
    const companies = await fetchCompaniesWithStats(userId);
    for (const company of companies) {
      if (
        !matchesSearchQuery(q, [
          company.name,
          company.industry,
          company.website,
          company.owner,
        ])
      ) {
        continue;
      }
      push({
        id: `company-${company.id}`,
        label: company.name,
        description: [company.industry, company.status].filter(Boolean).join(" · "),
        href: `/dashboard/crm/companies/${company.id}`,
        category: "Companies",
      });
      if (countCategory("Companies") >= PER_CATEGORY_LIMIT) {
        break;
      }
    }
  } catch {
    // CRM optional
  }

  // Deals (live CRM)
  try {
    const deals = await fetchDealsEnriched(userId);
    for (const deal of deals) {
      if (
        !matchesSearchQuery(q, [
          deal.title,
          deal.companyName,
          deal.contactName,
          deal.stage,
          deal.owner,
        ])
      ) {
        continue;
      }
      push({
        id: `deal-${deal.id}`,
        label: deal.title,
        description: `${deal.companyName} · ${deal.stage} · $${deal.value.toLocaleString()}`,
        href: "/dashboard/crm/deals",
        category: "Deals",
      });
      if (countCategory("Deals") >= PER_CATEGORY_LIMIT) {
        break;
      }
    }
  } catch {
    // CRM optional
  }

  // Automations
  try {
    const workflows = await automationRepository.listWorkflows(userId);
    for (const workflow of workflows) {
      if (
        !matchesSearchQuery(q, [workflow.name, workflow.description, workflow.status])
      ) {
        continue;
      }
      push({
        id: `automation-${workflow.id}`,
        label: workflow.name,
        description: `${workflow.status} · ${workflow.description || "Workflow"}`,
        href: "/dashboard/automations",
        category: "Automations",
      });
      if (countCategory("Automations") >= PER_CATEGORY_LIMIT) {
        break;
      }
    }
  } catch {
    // Automations optional
  }

  return ranked
    .sort((a, b) => b.rank - a.rank)
    .slice(0, TOTAL_LIMIT)
    .map(({ rank: _rank, ...result }) => result);
}
