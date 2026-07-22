import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createUserNotification } from "@/lib/notifications/repository";
import {
  generateEmailReply,
  generateEmailSummary,
} from "@/lib/openai";
import { resolveOpenAiApiKey } from "@/lib/openai/api-key";
import { sendEmailReply } from "@/lib/gmail";
import { getCalendarProvider } from "@/lib/calendar/providers";
import { upsertSyncedMeetings } from "@/lib/calendar/sync";
import {
  getCalendarAuthForUser,
  getGmailClientForUser,
} from "@/lib/automations/integrations";
import { simulateStepOutput } from "@/lib/automations/mock-payloads";
import type { WorkflowNode } from "@/lib/automations/types";

export type StepContext = Record<string, unknown> & {
  userId: string;
  isTest?: boolean;
};

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asEmail(value: unknown): string {
  const s = str(value).trim();
  const match = s.match(/[\w.+-]+@[\w.-]+\.\w+/);
  return (match?.[0] ?? s).toLowerCase();
}

/**
 * Execute one workflow step with live side effects when possible.
 * Falls back to simulation output when integrations are unavailable.
 */
export async function executeLiveStep(
  node: WorkflowNode,
  context: StepContext
): Promise<Record<string, unknown>> {
  const userId = context.userId;
  const isTest = Boolean(context.isTest);

  try {
    switch (node.blockId) {
      case "summarize-email": {
        const subject = str(context.subject, "Email");
        const body = str(context.body || context.preview, "");
        if (!body && !resolveOpenAiApiKey()) {
          return simulateStepOutput(node, context);
        }
        try {
          const summary = await generateEmailSummary({
            sender: str(context.from || context.sender, "Unknown"),
            subject,
            body: body || subject,
          });
          return { summary, sentiment: "neutral" };
        } catch {
          return simulateStepOutput(node, context);
        }
      }

      case "generate-reply": {
        try {
          const draft = await generateEmailReply({
            sender: str(context.from || context.sender, "there"),
            subject: str(context.subject, "Re: your message"),
            body: str(context.body || context.preview, str(context.summary)),
            tone: "professional",
          });
          return { draft, replyDraft: draft };
        } catch {
          return simulateStepOutput(node, context);
        }
      }

      case "extract-contact": {
        const email = asEmail(context.from || context.email || context.sender);
        const name =
          str(context.name) ||
          str(context.sender).replace(/<.*>/, "").trim() ||
          email.split("@")[0] ||
          "Unknown";
        const company =
          str(context.company || context.companyName) ||
          (email.includes("@") ? email.split("@")[1]?.split(".")[0] ?? "" : "");
        return { name, email, company, companyName: company };
      }

      case "create-crm-lead":
      case "update-crm": {
        return await upsertCrmContact(userId, context);
      }

      case "create-deal": {
        return await createCrmDeal(userId, context);
      }

      case "classify-email": {
        const subject = str(context.subject).toLowerCase();
        const body = str(context.body || context.preview).toLowerCase();
        const text = `${subject} ${body}`;
        let category = "general";
        if (/demo|pricing|enterprise|sales|quote/.test(text)) category = "sales";
        else if (/support|bug|issue|help|error/.test(text)) category = "support";
        else if (/invoice|payment|billing/.test(text)) category = "finance";
        return { category, confidence: 0.85 };
      }

      case "detect-priority": {
        const text = `${str(context.subject)} ${str(context.body)}`.toLowerCase();
        const high = /urgent|asap|critical|immediately|deadline/.test(text);
        return {
          priority: high ? "high" : "medium",
          score: high ? 90 : 60,
        };
      }

      case "generate-followup": {
        const followUpAt = new Date(
          Date.now() + 24 * 60 * 60_000
        ).toISOString();
        return {
          followUpAt,
          channel: "email",
          followUpTitle: `Follow up: ${str(context.title || context.subject, "Meeting")}`,
        };
      }

      case "condition": {
        const priority = str(context.priority);
        const matched =
          priority === "high" ||
          context.unread === true ||
          str(context.category) === "sales";
        return { branch: matched ? "true" : "false", matched };
      }

      case "send-email": {
        if (isTest) {
          return {
            sent: false,
            skipped: true,
            reason: "Test runs do not send live email",
            draft: str(context.draft || context.replyDraft),
          };
        }
        const draft = str(context.draft || context.replyDraft);
        const to = asEmail(context.from || context.email || context.to);
        const threadId = str(context.threadId || context.gmailThreadId);
        const messageId = str(context.messageId || context.gmailMessageId);
        if (!draft || !to) {
          return { sent: false, reason: "Missing draft or recipient" };
        }
        const auth = await getGmailClientForUser(userId);
        if (!auth || !threadId) {
          return {
            sent: false,
            draftSaved: true,
            draft,
            reason: "Gmail not connected or missing thread — draft prepared",
          };
        }
        try {
          const subject = str(context.subject, "Re: your message");
          const replySubject = subject.startsWith("Re:")
            ? subject
            : `Re: ${subject}`;
          const result = await sendEmailReply(auth, {
            threadId,
            to,
            subject: replySubject,
            body: draft,
            inReplyTo: messageId || undefined,
            references: messageId || undefined,
          });
          return { sent: true, messageId: result.id };
        } catch (error) {
          return {
            sent: false,
            draft,
            error: error instanceof Error ? error.message : "Send failed",
          };
        }
      }

      case "create-task": {
        return await createTask(userId, context);
      }

      case "notify-user": {
        const title = str(
          context.notifyTitle || context.subject || context.title,
          "Automation alert"
        );
        await createUserNotification(userId, {
          category: "Automations",
          title,
          body: str(
            context.summary || context.draft || context.description,
            "Your automation completed a step."
          ),
          href: "/dashboard/automations",
        });
        return { notified: true, channel: "in-app" };
      }

      case "create-meeting": {
        return await createMeeting(userId, context, isTest);
      }

      case "log-activity": {
        const db = getSupabaseAdmin();
        const contactId = str(context.contactId);
        if (db && contactId) {
          await db.from("crm_activities").insert({
            user_id: userId,
            contact_id: contactId,
            deal_id: str(context.dealId) || null,
            activity_type: "task",
            title: str(context.subject || context.title, "Automation activity"),
            body: str(context.summary || context.draft),
            metadata: { source: "automation" },
          });
        }
        return { logged: true };
      }

      case "slack-whatsapp": {
        await createUserNotification(userId, {
          category: "Automations",
          title: "Channel message queued",
          body: str(context.summary || context.draft, "Notification prepared"),
          href: "/dashboard/automations",
        });
        return { delivered: true, channel: "in-app-fallback" };
      }

      default:
        if (node.category === "trigger") {
          return { triggered: true, ...context };
        }
        return simulateStepOutput(node, context);
    }
  } catch (error) {
    console.error(`[automations/step] ${node.blockId} failed`, error);
    // Graceful degradation
    return {
      ...simulateStepOutput(node, context),
      liveError: error instanceof Error ? error.message : "Step failed",
      degraded: true,
    };
  }
}

async function upsertCrmContact(
  userId: string,
  context: StepContext
): Promise<Record<string, unknown>> {
  const db = getSupabaseAdmin();
  if (!db) return simulateStepOutput({ blockId: "update-crm" } as WorkflowNode, context);

  const email = asEmail(context.email || context.from);
  const name =
    str(context.name) ||
    email.split("@")[0] ||
    "New lead";
  const companyName = str(context.company || context.companyName);

  if (email) {
    const { data: existing } = await db
      .from("crm_contacts")
      .select("id, name")
      .eq("user_id", userId)
      .ilike("email", email)
      .maybeSingle();

    if (existing) {
      await db
        .from("crm_contacts")
        .update({
          company_name: companyName || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      return {
        contactId: existing.id,
        leadId: existing.id,
        updated: true,
        name: existing.name,
        email,
      };
    }
  }

  const { data, error } = await db
    .from("crm_contacts")
    .insert({
      user_id: userId,
      name,
      email: email || null,
      company_name: companyName || null,
      status: "lead",
      ai_lead_score: typeof context.score === "number" ? context.score : 70,
    })
    .select("id, name")
    .single();

  if (error || !data) {
    return { updated: false, error: error?.message ?? "CRM insert failed" };
  }

  return {
    contactId: data.id,
    leadId: data.id,
    updated: true,
    created: true,
    name: data.name,
    email,
  };
}

async function createCrmDeal(
  userId: string,
  context: StepContext
): Promise<Record<string, unknown>> {
  const db = getSupabaseAdmin();
  if (!db) {
    return { dealId: "deal-sim", stage: "lead", created: true };
  }

  let contactId = str(context.contactId || context.leadId) || null;
  if (!contactId) {
    const contact = await upsertCrmContact(userId, context);
    contactId = str(contact.contactId) || null;
  }

  const title =
    str(context.dealTitle) ||
    `Deal · ${str(context.name || context.company || context.subject, "New opportunity")}`;

  const { data, error } = await db
    .from("crm_deals")
    .insert({
      user_id: userId,
      title,
      contact_id: contactId,
      stage: "lead",
      value: typeof context.value === "number" ? context.value : 0,
      probability: 20,
      priority: "medium",
      owner: "",
      ai_score: 60,
      labels: ["automation"],
    })
    .select("id, title, stage")
    .single();

  if (error || !data) {
    return { created: false, error: error?.message ?? "Deal create failed" };
  }

  if (contactId) {
    await db.from("crm_activities").insert({
      user_id: userId,
      contact_id: contactId,
      deal_id: data.id,
      activity_type: "deal_created",
      title: `Deal created: ${data.title}`,
      body: "Created by Actora automation",
      metadata: { source: "automation" },
    });
  }

  return {
    dealId: data.id,
    stage: data.stage,
    title: data.title,
    created: true,
    contactId,
  };
}

async function createTask(
  userId: string,
  context: StepContext
): Promise<Record<string, unknown>> {
  const db = getSupabaseAdmin();
  if (!db) {
    return {
      taskId: "task-sim",
      title: str(context.followUpTitle || context.subject, "Follow up"),
    };
  }

  const due = str(context.followUpAt) ||
    new Date(Date.now() + 24 * 60 * 60_000).toISOString();
  const title =
    str(context.followUpTitle) ||
    str(context.taskTitle) ||
    `Follow up: ${str(context.subject || context.title, "item")}`;

  const priority =
    str(context.priority) === "high"
      ? "high"
      : str(context.priority) === "low"
        ? "low"
        : "medium";

  const { data, error } = await db
    .from("tasks")
    .insert({
      user_id: userId,
      title,
      description: str(context.summary || context.draft || context.body).slice(
        0,
        2000
      ),
      priority,
      status: "todo",
      due_date: due,
      assignee: "",
      company_name: str(context.company || context.companyName) || null,
      tags: ["automation"],
    })
    .select("id, title")
    .single();

  if (error || !data) {
    return { created: false, error: error?.message ?? "Task create failed" };
  }

  return { taskId: data.id, title: data.title, created: true };
}

async function createMeeting(
  userId: string,
  context: StepContext,
  isTest: boolean
): Promise<Record<string, unknown>> {
  const startAt =
    str(context.startTime || context.startAt) ||
    new Date(Date.now() + 2 * 60 * 60_000).toISOString();
  const endAt =
    str(context.endAt) ||
    new Date(new Date(startAt).getTime() + 30 * 60_000).toISOString();
  const title = str(context.title || context.subject, "Meeting");
  const attendees = Array.isArray(context.attendees)
    ? (context.attendees as string[])
    : [asEmail(context.from || context.email)].filter(Boolean);

  const auth = await getCalendarAuthForUser(userId);
  if (auth && !isTest) {
    try {
      const provider = getCalendarProvider("google");
      const remote = await provider.createEvent(auth.oauth2Client, {
        title,
        description: str(context.summary || context.notes),
        startAt,
        endAt,
        attendees,
        addMeetLink: true,
        reminderMinutes: 30,
        contactEmail: attendees[0],
        source: "ai",
      });
      await upsertSyncedMeetings(userId, [remote]);
      return {
        eventId: remote.id,
        externalId: remote.externalId,
        meetingLink: remote.meetingLink,
        scheduled: true,
      };
    } catch (error) {
      console.error("[automations] create meeting failed", error);
    }
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return { eventId: "cal-sim", scheduled: true };
  }

  const { data, error } = await db
    .from("meetings")
    .insert({
      user_id: userId,
      title,
      description: str(context.summary),
      starts_at: startAt,
      ends_at: endAt,
      status: "scheduled",
      source: "ai",
      attendees: attendees.map((email) => ({ email })),
      contact_email: attendees[0] ?? null,
      all_day: false,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { scheduled: false, error: error?.message };
  }

  return { eventId: data.id, scheduled: true, local: true };
}
