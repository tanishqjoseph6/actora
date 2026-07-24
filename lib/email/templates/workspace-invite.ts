import { getAppUrl } from "@/lib/email/config";
import { actoraEmailLayout } from "@/lib/email/templates/layout";

export function buildWorkspaceInviteEmail(input: {
  workspaceName: string;
  inviterEmail: string;
  roleLabel: string;
  inviteUrl: string;
}) {
  return {
    subject: `You're invited to ${input.workspaceName} on Actora`,
    html: actoraEmailLayout({
      eyebrow: "ACTORA · WORKSPACE",
      heading: `Join ${input.workspaceName}`,
      body: `${input.inviterEmail} invited you as ${input.roleLabel}. Accept the invitation to collaborate on inbox, CRM, and Roxxx AI in this workspace.`,
      ctaLabel: "Accept invitation",
      ctaHref: input.inviteUrl || `${getAppUrl()}/dashboard/settings#workspace-members`,
    }),
  };
}
