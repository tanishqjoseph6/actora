"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CrmBackLink } from "@/components/crm/CrmBackLink";
import { CrmSubNav } from "@/components/crm/CrmSubNav";
import { ContactMeetingsSection } from "@/components/crm/ContactMeetingsSection";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { getAiScoreStyle } from "@/lib/crm/entities";
import type { CrmContact, CrmContactStatus } from "@/lib/crm/live";
import type { CrmContactInsights } from "@/lib/openai/types";

const STATUS_STYLES: Record<CrmContactStatus, string> = {
  active: "bg-emerald-500/15 border-emerald-400/25 text-emerald-400",
  lead: "bg-blue-500/15 border-blue-400/25 text-blue-300",
  inactive: "bg-gray-500/15 border-gray-400/25 text-gray-400",
};

type Activity = {
  id: string;
  type: string;
  title: string;
  body: string;
  relativeTime: string;
};

type Note = {
  id: string;
  body: string;
  createdAt: string;
};

type EmailHistory = {
  id: string;
  gmailMessageId: string;
  subject: string;
  snippet: string;
  relativeTime: string;
};

export function ContactProfileView({ contact }: { contact: CrmContact }) {
  const aiGradient = getAiScoreStyle(contact.aiLeadScore);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [emails, setEmails] = useState<EmailHistory[]>([]);
  const [insights, setInsights] = useState<CrmContactInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    void (async () => {
      const [actRes, notesRes, emailsRes] = await Promise.all([
        fetch(`/api/crm/contacts/${contact.id}/activities`),
        fetch(`/api/crm/contacts/${contact.id}/notes`),
        fetch(`/api/crm/contacts/${contact.id}/emails`),
      ]);
      const actJson = (await actRes.json()) as { activities?: Activity[] };
      const notesJson = (await notesRes.json()) as { notes?: Note[] };
      const emailsJson = (await emailsRes.json()) as { emails?: EmailHistory[] };
      setActivities(actJson.activities ?? []);
      setNotes(notesJson.notes ?? []);
      setEmails(emailsJson.emails ?? []);
    })();
  }, [contact.id]);

  useEffect(() => {
    void (async () => {
      setInsightsLoading(true);
      try {
        const res = await fetch(`/api/crm/contacts/${contact.id}/insights`);
        const json = (await res.json()) as { insights?: CrmContactInsights };
        setInsights(json.insights ?? null);
      } finally {
        setInsightsLoading(false);
      }
    })();
  }, [contact.id]);

  async function addNote() {
    const body = noteDraft.trim();
    if (!body || savingNote) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/crm/contacts/${contact.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const json = (await res.json()) as { note?: Note };
      if (json.note) {
        setNotes((prev) => [json.note!, ...prev]);
        setNoteDraft("");
      }
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <>
      <CrmBackLink href="/dashboard/crm/contacts" label="Back to contacts" />
      <div className="mb-6">
        <CrmSubNav />
      </div>
      <div className={`${dashboard.panelLg} mb-6`}>
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{contact.name}</h1>
          <span
            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide border ${STATUS_STYLES[contact.status]}`}
          >
            {contact.status}
          </span>
        </div>
        <p className="text-gray-400 mb-1">{contact.companyName || "No company"}</p>
        {contact.title && (
          <p className="text-sm text-[#71717A] mb-1">{contact.title}</p>
        )}
        <p className="text-[#93C5FD] mb-4">{contact.email || "No email"}</p>
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r ${aiGradient} border border-white/10`}
        >
          <span className="text-sm font-bold text-white">
            AI Lead Score · {contact.aiLeadScore}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <section className={`${dashboard.cardLg} p-5 sm:p-6`}>
          <h2 className="text-lg font-bold text-white mb-4">AI Insights</h2>
          {insightsLoading ? (
            <p className="text-sm text-[#71717A]">Analyzing contact context…</p>
          ) : insights ? (
            <div className="space-y-4">
              <p className="text-sm text-[#A1A1AA] leading-relaxed">{insights.summary}</p>
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-wider text-[#71717A]">
                  Engagement
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-[#0A0A0A] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#3B82F6]"
                    style={{ width: `${insights.engagementScore}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-white tabular-nums">
                  {insights.engagementScore}
                </span>
              </div>
              <RiskBadge level={insights.riskLevel} />
              {insights.nextSteps.length > 0 && (
                <ul className="space-y-2">
                  {insights.nextSteps.map((step) => (
                    <li
                      key={step}
                      className="text-sm text-[#A1A1AA] flex items-start gap-2"
                    >
                      <span className="text-[#3B82F6] mt-0.5">→</span>
                      {step}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="text-sm text-[#71717A]">Insights unavailable.</p>
          )}
        </section>

        <section className={`${dashboard.cardLg} p-5 sm:p-6`}>
          <h2 className="text-lg font-bold text-white mb-4">Contact details</h2>
          <dl className="space-y-4 text-sm">
            <Detail label="Name" value={contact.name} />
            <Detail label="Email" value={contact.email || "—"} />
            <Detail label="Phone" value={contact.phone || "—"} />
            <Detail label="Title" value={contact.title || "—"} />
            <Detail label="Company" value={contact.companyName || "—"} />
            <Detail label="Owner" value={contact.owner || "—"} />
            <Detail label="Status" value={contact.status} />
            <Detail
              label="Created"
              value={new Date(contact.createdAt).toLocaleString()}
            />
          </dl>
        </section>
      </div>

      <section className={`${dashboard.cardLg} p-5 sm:p-6 mb-6`}>
        <h2 className="text-lg font-bold text-white mb-4">Notes</h2>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Add a note about this contact…"
            rows={2}
            className="flex-1 px-3 py-2 rounded-xl bg-[#111111] border border-white/[0.06] text-sm text-white placeholder:text-[#71717A] focus:outline-none focus:border-[#3B82F6]/50 resize-none"
          />
          <button
            type="button"
            onClick={() => void addNote()}
            disabled={!noteDraft.trim() || savingNote}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8] disabled:opacity-50 shrink-0"
          >
            {savingNote ? "Saving…" : "Add note"}
          </button>
        </div>
        {notes.length === 0 ? (
          <p className="text-sm text-[#71717A]">No notes yet.</p>
        ) : (
          <ul className="space-y-3">
            {notes.map((note) => (
              <li
                key={note.id}
                className="p-3 rounded-xl border border-white/[0.06] bg-[#111111]"
              >
                <p className="text-sm text-[#A1A1AA] whitespace-pre-wrap">{note.body}</p>
                <p className="text-[10px] text-[#71717A] mt-2">
                  {new Date(note.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={`${dashboard.cardLg} p-5 sm:p-6 mb-6`}>
        <h2 className="text-lg font-bold text-white mb-4">Email history</h2>
        {emails.length === 0 ? (
          <p className="text-sm text-[#71717A]">
            Linked emails appear here when Gmail messages match this contact&apos;s email.
          </p>
        ) : (
          <ul className="space-y-2">
            {emails.map((email) => (
              <li key={email.id}>
                <Link
                  href={`/dashboard/inbox?message=${email.gmailMessageId}`}
                  className="block p-3 rounded-xl border border-white/[0.06] bg-[#111111] hover:border-[#3B82F6]/40 transition-colors"
                >
                  <p className="text-sm font-medium text-white truncate">{email.subject}</p>
                  <p className="text-xs text-[#71717A] truncate mt-0.5">{email.snippet}</p>
                  <p className="text-[10px] text-[#71717A] mt-1">{email.relativeTime}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={`${dashboard.cardLg} p-5 sm:p-6 mb-6`}>
        <h2 className="text-lg font-bold text-white mb-4">Activity timeline</h2>
        {activities.length === 0 ? (
          <p className="text-sm text-[#71717A]">No activity recorded yet.</p>
        ) : (
          <ul className="space-y-0">
            {activities.map((activity, i) => (
              <li key={activity.id} className="flex gap-3 pb-4 relative">
                {i < activities.length - 1 && (
                  <span className="absolute left-[11px] top-6 bottom-0 w-px bg-white/[0.06]" />
                )}
                <span className="w-6 h-6 rounded-full bg-[#2563EB]/20 border border-[#3B82F6]/40 flex items-center justify-center shrink-0 mt-0.5">
                  <ActivityIcon type={activity.type} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{activity.title}</p>
                  {activity.body && (
                    <p className="text-xs text-[#71717A] mt-0.5 line-clamp-2">
                      {activity.body}
                    </p>
                  )}
                  <p className="text-[10px] text-[#71717A] mt-1">{activity.relativeTime}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ContactMeetingsSection contactEmail={contact.email} />
    </>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-gray-500 text-xs uppercase tracking-wider mb-1">{label}</dt>
      <dd className="text-gray-300">{value}</dd>
    </div>
  );
}

function RiskBadge({ level }: { level: "low" | "medium" | "high" }) {
  const styles = {
    low: "bg-emerald-500/15 border-emerald-400/25 text-emerald-400",
    medium: "bg-amber-500/15 border-amber-400/25 text-amber-300",
    high: "bg-red-500/15 border-red-400/25 text-red-400",
  };
  return (
    <span
      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase border ${styles[level]}`}
    >
      {level} risk
    </span>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const cls = "w-3 h-3 text-[#93C5FD]";
  if (type === "email") {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  }
  if (type === "deal_stage" || type === "deal_created") {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}
