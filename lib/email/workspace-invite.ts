import "server-only";

import { sendProductionEmail } from "@/lib/email/send";
import { buildWorkspaceInviteEmail } from "@/lib/email/templates/workspace-invite";

export async function sendWorkspaceInvitationEmail(input: {
  to: string;
  workspaceName: string;
  inviterEmail: string;
  roleLabel: string;
  inviteUrl: string;
}) {
  const template = buildWorkspaceInviteEmail(input);
  return sendProductionEmail({
    to: input.to,
    subject: template.subject,
    html: template.html,
    category: "workspace_invite",
    tags: [{ name: "category", value: "workspace_invite" }],
  });
}
