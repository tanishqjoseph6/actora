import { actoraEmailLayout } from "./layout";
import { getAppUrl } from "../config";
import { withFounderSignature } from "@/lib/contact";

export function welcomeOnboardingEmail(name?: string) {
  const app = getAppUrl();
  return {
    subject: "Welcome to Actora",
    html: actoraEmailLayout({
      eyebrow: "WELCOME",
      heading: `Welcome${name ? `, ${name}` : ""} — conversations become execution`,
      body: `Actora is your AI-native workspace for inbox, CRM, tasks, meetings, and automations. Roxx AI turns intent into action.<br/><br/>Start by connecting Gmail and asking Roxx your first question.`,
      ctaLabel: "Open Actora",
      ctaHref: `${app}/dashboard`,
    }),
    text: withFounderSignature(`Welcome to Actora. Open ${app}/dashboard to get started.`),
  };
}

export function workspaceOnboardingEmail() {
  const app = getAppUrl();
  return {
    subject: "Create your first workspace",
    html: actoraEmailLayout({
      eyebrow: "DAY 1",
      heading: "Set up your workspace",
      body: `Your workspace is where team context, CRM, and AI credits live together. Name it, invite later — start organizing today.`,
      ctaLabel: "Open settings",
      ctaHref: `${app}/dashboard/settings#workspace-general`,
    }),
    text: withFounderSignature(`Create your workspace: ${app}/dashboard/settings`),
  };
}

export function roxxOnboardingEmail() {
  const app = getAppUrl();
  return {
    subject: "Use Roxx AI today",
    html: actoraEmailLayout({
      eyebrow: "DAY 3",
      heading: "Ask Roxx anything",
      body: `Try: “Summarize my unread emails and suggest follow-ups.” Roxx can create tasks, update CRM, and draft replies — press ⌘K anytime.`,
      ctaLabel: "Open Roxx AI",
      ctaHref: `${app}/dashboard`,
    }),
    text: withFounderSignature(`Ask Roxx AI: ${app}/dashboard`),
  };
}

export function inviteTeammatesOnboardingEmail() {
  const app = getAppUrl();
  return {
    subject: "Invite your teammates",
    html: actoraEmailLayout({
      eyebrow: "DAY 5",
      heading: "Work better together",
      body: `Invite teammates by email with Owner, Admin, or Member roles. Shared AI credits and one workspace — no more tool-switching.`,
      ctaLabel: "Invite teammates",
      ctaHref: `${app}/dashboard/settings#workspace-members`,
    }),
    text: withFounderSignature(`Invite teammates: ${app}/dashboard/settings#workspace-members`),
  };
}

export function workflowsOnboardingEmail() {
  const app = getAppUrl();
  return {
    subject: "Advanced workflows in Actora",
    html: actoraEmailLayout({
      eyebrow: "DAY 7",
      heading: "Automate the follow-through",
      body: `Build automations that move from email → CRM → task → reminder. Let Actora run the busywork so you stay on execution.`,
      ctaLabel: "Open Automations",
      ctaHref: `${app}/dashboard/automations`,
    }),
    text: withFounderSignature(`Automations: ${app}/dashboard/automations`),
  };
}

export function upgradeOnboardingEmail() {
  const app = getAppUrl();
  return {
    subject: "Ready to upgrade Actora?",
    html: actoraEmailLayout({
      eyebrow: "DAY 14",
      heading: "Unlock Pro or Team",
      body: `You’re two weeks in. Upgrade for more AI credits, team workspaces, and advanced Roxx models — keep conversations becoming execution.`,
      ctaLabel: "View pricing",
      ctaHref: `${app}/pricing`,
    }),
    text: withFounderSignature(`Upgrade: ${app}/pricing`),
  };
}

export function referralRewardEmail(input: {
  rewardLabel: string;
  successfulCount: number;
}) {
  const app = getAppUrl();
  return {
    subject: "You earned a referral reward",
    html: actoraEmailLayout({
      eyebrow: "REFERRAL",
      heading: input.rewardLabel,
      body: `Thanks for spreading Actora. You now have ${input.successfulCount} successful referral${input.successfulCount === 1 ? "" : "s"}. Your reward has been applied to your account.`,
      ctaLabel: "View referrals",
      ctaHref: `${app}/dashboard/settings#referrals`,
    }),
    text: withFounderSignature(`Referral reward: ${input.rewardLabel}. ${app}/dashboard/settings#referrals`),
  };
}
