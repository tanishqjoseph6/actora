"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";

export type AgentStep = {
  id: string;
  step: string;
  status: "running" | "done" | "error";
  detail?: string;
};

const LABELS: Record<string, string> = {
  get_important_emails: "Find important emails",
  summarize_todays_emails: "Summarize inbox",
  explain_pipeline: "Analyze CRM pipeline",
  suggest_followups: "Suggest follow-ups",
  search_workspace: "Search workspace",
  create_task: "Create task",
  create_crm_contact: "Create CRM lead",
  create_deal: "Create deal",
  schedule_meeting: "Schedule meeting",
  generate_email_reply: "Draft email",
  create_automation: "Create automation",
  list_overdue_tasks: "List overdue tasks",
  generate_weekly_report: "Generate weekly report",
  run_stale_lead_followup: "Follow up stale leads",
};

export function AgentProgressTimeline({ steps }: { steps: AgentStep[] }) {
  if (steps.length === 0) return null;

  return (
    <div className="mb-3 rounded-xl border border-[#3B82F6]/20 bg-[#3B82F6]/[0.06] px-3 py-2.5">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-[#93C5FD]">
        Agent execution
      </p>
      <ul className="space-y-1.5">
        {steps.map((step, index) => {
          const label = LABELS[step.step] ?? step.step.replace(/_/g, " ");
          return (
            <motion.li
              key={step.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
              className="flex items-start gap-2 text-xs"
            >
              {step.status === "running" ? (
                <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-[#3B82F6]" />
              ) : step.status === "error" ? (
                <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
              ) : step.status === "done" ? (
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              ) : (
                <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#52525B]" />
              )}
              <span className="min-w-0">
                <span className="font-medium text-white">{label}</span>
                {step.detail && (
                  <span className="mt-0.5 block text-[#71717A]">{step.detail}</span>
                )}
              </span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
