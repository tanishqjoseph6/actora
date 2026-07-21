import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createUserNotification } from "@/lib/notifications/repository";
import { generateEmailReply } from "@/lib/openai";
import { getCalendarProvider } from "@/lib/calendar/providers";
import { upsertSyncedMeetings } from "@/lib/calendar/sync";
import { getCalendarAuthForUser } from "@/lib/automations/integrations";
import { blockToNode, getBlockById } from "@/lib/automations/constants";
import { automationRepository } from "@/lib/automations/repository";
import { searchWorkspace, type WorkspaceContext } from "@/lib/assistant/context";
import type OpenAI from "openai";

export const ASSISTANT_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_important_emails",
      description: "List important or unread emails from the user's inbox sample.",
      parameters: {
        type: "object",
        properties: {
          unreadOnly: { type: "boolean" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "summarize_todays_emails",
      description: "Summarize today's / recent inbox emails for the user.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "explain_pipeline",
      description: "Explain CRM deal pipeline status and open revenue.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "suggest_followups",
      description:
        "Suggest follow-up actions based on emails, deals, tasks, and meetings.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "search_workspace",
      description: "Search across emails, CRM, deals, tasks, meetings, automations.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Create a task in Actora.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          dueInDays: { type: "number" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_crm_contact",
      description: "Create a CRM contact / lead.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
          companyName: { type: "string" },
          status: { type: "string", enum: ["lead", "active", "inactive"] },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_deal",
      description: "Create a CRM deal in the pipeline.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          value: { type: "number" },
          stage: {
            type: "string",
            enum: ["lead", "qualified", "proposal", "negotiation"],
          },
          contactEmail: { type: "string" },
          contactName: { type: "string" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "schedule_meeting",
      description: "Schedule a calendar meeting (Google Meet when connected).",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          startAt: { type: "string", description: "ISO datetime" },
          durationMinutes: { type: "number" },
          attendeeEmail: { type: "string" },
          addMeetLink: { type: "boolean" },
          notes: { type: "string" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_email_reply",
      description: "Draft an email reply for a sender/subject/body.",
      parameters: {
        type: "object",
        properties: {
          sender: { type: "string" },
          subject: { type: "string" },
          body: { type: "string" },
        },
        required: ["sender", "subject", "body"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_automation",
      description:
        "Create a draft automation workflow from a recipe id or block list.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          recipe: {
            type: "string",
            enum: [
              "gmail-crm",
              "gmail-tasks",
              "gmail-calendar",
              "gmail-ai-reply",
              "lead-deal",
              "meeting-followup",
            ],
          },
        },
        required: ["name"],
      },
    },
  },
];

const RECIPE_BLOCKS: Record<string, string[]> = {
  "gmail-crm": [
    "new-email",
    "extract-contact",
    "create-crm-lead",
    "update-crm",
    "notify-user",
  ],
  "gmail-tasks": [
    "new-email",
    "classify-email",
    "detect-priority",
    "create-task",
    "notify-user",
  ],
  "gmail-calendar": [
    "new-email",
    "summarize-email",
    "create-meeting",
    "notify-user",
  ],
  "gmail-ai-reply": ["new-email", "generate-reply", "send-email", "log-activity"],
  "lead-deal": [
    "new-lead",
    "extract-contact",
    "create-deal",
    "update-crm",
    "notify-user",
  ],
  "meeting-followup": [
    "meeting-created",
    "generate-followup",
    "create-task",
    "notify-user",
    "log-activity",
  ],
};

export async function executeAssistantTool(
  userId: string,
  name: string,
  argsJson: string,
  context: WorkspaceContext
): Promise<Record<string, unknown>> {
  let args: Record<string, unknown> = {};
  try {
    args = JSON.parse(argsJson || "{}") as Record<string, unknown>;
  } catch {
    args = {};
  }

  switch (name) {
    case "get_important_emails": {
      const unreadOnly = Boolean(args.unreadOnly);
      const limit = typeof args.limit === "number" ? args.limit : 8;
      let list = context.emails;
      if (unreadOnly) list = list.filter((e) => e.unread);
      else
        list = list.filter(
          (e) =>
            e.unread ||
            e.priority === "high" ||
            /urgent|demo|proposal|invoice|meeting/i.test(
              `${e.subject} ${e.preview}`
            )
        );
      return { emails: list.slice(0, limit) };
    }

    case "summarize_todays_emails": {
      const unread = context.emails.filter((e) => e.unread);
      return {
        totalSampled: context.emails.length,
        unreadCount: unread.length,
        highlights: context.emails.slice(0, 10).map((e) => ({
          from: e.sender,
          subject: e.subject,
          preview: e.preview,
          unread: e.unread,
        })),
      };
    }

    case "explain_pipeline": {
      const total = context.deals.reduce((s, d) => s + d.value, 0);
      const byStage: Record<string, number> = {};
      for (const d of context.deals) {
        byStage[d.stage] = (byStage[d.stage] ?? 0) + 1;
      }
      return {
        openDeals: context.deals.length,
        pipelineValue: total,
        byStage,
        deals: context.deals.slice(0, 12),
      };
    }

    case "suggest_followups": {
      const suggestions: string[] = [];
      for (const e of context.emails.filter((x) => x.unread).slice(0, 5)) {
        suggestions.push(`Reply to ${e.sender} about “${e.subject}”`);
      }
      for (const d of context.deals.filter((x) => x.stage === "negotiation").slice(0, 3)) {
        suggestions.push(`Advance deal “${d.title}” (${d.companyName})`);
      }
      for (const t of context.tasks.slice(0, 4)) {
        suggestions.push(`Complete task “${t.title}” (due ${new Date(t.dueDate).toLocaleDateString()})`);
      }
      for (const m of context.meetings.slice(0, 3)) {
        suggestions.push(`Prep for meeting “${m.title}” at ${new Date(m.startAt).toLocaleString()}`);
      }
      return { suggestions: suggestions.slice(0, 10) };
    }

    case "search_workspace": {
      const query = String(args.query ?? "").trim();
      if (!query) return { results: [] };
      const results = await searchWorkspace(userId, query);
      return { results };
    }

    case "create_task": {
      const db = getSupabaseAdmin();
      if (!db) return { ok: false, error: "Database not configured" };
      const title = String(args.title ?? "").trim();
      if (!title) return { ok: false, error: "Title required" };
      const dueInDays = typeof args.dueInDays === "number" ? args.dueInDays : 1;
      const due = new Date(Date.now() + dueInDays * 24 * 60 * 60_000).toISOString();
      const { data, error } = await db
        .from("tasks")
        .insert({
          user_id: userId,
          title,
          description: String(args.description ?? ""),
          priority: (args.priority as string) || "medium",
          status: "todo",
          due_date: due,
          tags: ["assistant"],
        })
        .select("id, title")
        .single();
      if (error || !data) return { ok: false, error: error?.message };
      await createUserNotification(userId, {
        category: "Roxx",
        title: "Task created",
        body: data.title,
        href: "/dashboard/tasks",
      });
      return { ok: true, taskId: data.id, title: data.title };
    }

    case "create_crm_contact": {
      const db = getSupabaseAdmin();
      if (!db) return { ok: false, error: "Database not configured" };
      const name = String(args.name ?? "").trim();
      if (!name) return { ok: false, error: "Name required" };
      const { data, error } = await db
        .from("crm_contacts")
        .insert({
          user_id: userId,
          name,
          email: String(args.email ?? "").trim() || null,
          company_name: String(args.companyName ?? "").trim() || null,
          status: (args.status as string) || "lead",
          ai_lead_score: 65,
        })
        .select("id, name, email")
        .single();
      if (error || !data) return { ok: false, error: error?.message };
      return { ok: true, contactId: data.id, name: data.name, email: data.email };
    }

    case "create_deal": {
      const db = getSupabaseAdmin();
      if (!db) return { ok: false, error: "Database not configured" };
      const title = String(args.title ?? "").trim();
      if (!title) return { ok: false, error: "Title required" };

      let contactId: string | null = null;
      const contactEmail = String(args.contactEmail ?? "").trim();
      if (contactEmail) {
        const { data: existing } = await db
          .from("crm_contacts")
          .select("id")
          .eq("user_id", userId)
          .ilike("email", contactEmail)
          .maybeSingle();
        if (existing) contactId = existing.id;
        else {
          const name = String(args.contactName ?? contactEmail.split("@")[0]);
          const { data: created } = await db
            .from("crm_contacts")
            .insert({
              user_id: userId,
              name,
              email: contactEmail,
              status: "lead",
              ai_lead_score: 60,
            })
            .select("id")
            .single();
          contactId = created?.id ?? null;
        }
      }

      const { data, error } = await db
        .from("crm_deals")
        .insert({
          user_id: userId,
          title,
          contact_id: contactId,
          stage: (args.stage as string) || "lead",
          value: typeof args.value === "number" ? args.value : 0,
          probability: 20,
          priority: "medium",
          labels: ["assistant"],
        })
        .select("id, title, stage, value")
        .single();
      if (error || !data) return { ok: false, error: error?.message };
      return {
        ok: true,
        dealId: data.id,
        title: data.title,
        stage: data.stage,
        value: data.value,
      };
    }

    case "schedule_meeting": {
      const title = String(args.title ?? "Meeting").trim();
      const duration =
        typeof args.durationMinutes === "number" ? args.durationMinutes : 30;
      const startAt =
        String(args.startAt ?? "") ||
        new Date(Date.now() + 2 * 60 * 60_000).toISOString();
      const endAt = new Date(
        new Date(startAt).getTime() + duration * 60_000
      ).toISOString();
      const attendee = String(args.attendeeEmail ?? "").trim();
      const addMeetLink = args.addMeetLink !== false;

      const auth = await getCalendarAuthForUser(userId);
      if (auth) {
        try {
          const provider = getCalendarProvider("google");
          const remote = await provider.createEvent(auth.oauth2Client, {
            title,
            description: String(args.notes ?? ""),
            startAt,
            endAt,
            attendees: attendee ? [attendee] : [],
            addMeetLink,
            reminderMinutes: 30,
            contactEmail: attendee || undefined,
            source: "ai",
          });
          await upsertSyncedMeetings(userId, [remote]);
          return {
            ok: true,
            eventId: remote.id,
            meetingLink: remote.meetingLink,
            startAt,
          };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : "Calendar create failed",
          };
        }
      }

      const db = getSupabaseAdmin();
      if (!db) return { ok: false, error: "Calendar not connected" };
      const { data, error } = await db
        .from("meetings")
        .insert({
          user_id: userId,
          title,
          description: String(args.notes ?? ""),
          starts_at: startAt,
          ends_at: endAt,
          status: "scheduled",
          source: "ai",
          attendees: attendee ? [{ email: attendee }] : [],
          contact_email: attendee || null,
          all_day: false,
        })
        .select("id")
        .single();
      if (error || !data) return { ok: false, error: error?.message };
      return { ok: true, eventId: data.id, startAt, local: true };
    }

    case "generate_email_reply": {
      try {
        const draft = await generateEmailReply({
          sender: String(args.sender ?? ""),
          subject: String(args.subject ?? ""),
          body: String(args.body ?? ""),
          tone: "professional",
        });
        return { ok: true, draft };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : "Reply failed",
        };
      }
    }

    case "create_automation": {
      const recipe = String(args.recipe ?? "gmail-tasks");
      const blocks = RECIPE_BLOCKS[recipe] ?? RECIPE_BLOCKS["gmail-tasks"];
      const nodes = blocks.map((id, i) => {
        const block = getBlockById(id);
        if (!block) throw new Error(`Unknown block ${id}`);
        return blockToNode(block, `assistant-${recipe}-${i}-${Date.now()}`);
      });
      const workflow = await automationRepository.createWorkflow(
        userId,
        {
          name: String(args.name ?? `Automation · ${recipe}`),
          description:
            String(args.description ?? "") ||
            `Created by Roxx (${recipe})`,
          nodes,
          metadata: { createdByAssistant: true, recipe },
          status: "draft",
        },
        userId
      );
      return {
        ok: true,
        workflowId: workflow.id,
        name: workflow.name,
        href: "/dashboard/automations",
      };
    }

    default:
      return { ok: false, error: `Unknown tool: ${name}` };
  }
}
