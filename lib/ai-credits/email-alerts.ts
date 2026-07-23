import type { AiCreditUsageMilestone } from "./milestones";
import { milestoneMessage, milestoneTitle } from "./milestones";

const FROM_EMAIL =
  process.env.TRIAL_EMAIL_FROM?.trim() ||
  process.env.EMAIL_FROM?.trim() ||
  "Actora <onboarding@useactora.com>";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
  "https://useactora.com";

function buildHtml(milestone: AiCreditUsageMilestone, message: string): string {
  const href = `${APP_URL}/billing#ai-credits`;
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#05070B;color:#E2E8F0;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0B1220;border:1px solid #1E293B;border-radius:16px;padding:32px;">
        <tr><td style="font-size:13px;color:#3B82F6;font-weight:600;letter-spacing:0.04em;">ACTORA · AI CREDITS</td></tr>
        <tr><td style="padding-top:16px;font-size:22px;font-weight:700;color:#fff;">${milestoneTitle(milestone)}</td></tr>
        <tr><td style="padding-top:12px;font-size:15px;line-height:1.6;color:#94A3B8;">${message}</td></tr>
        <tr><td style="padding-top:28px;">
          <a href="${href}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;font-size:14px;">Manage AI credits</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function sendAiCreditUsageEmail(
  to: string,
  milestone: AiCreditUsageMilestone
): Promise<{ sent: boolean; skipped?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[ai-credits/email] RESEND_API_KEY not set — skipping", {
      to,
      milestone,
    });
    return { sent: false, skipped: "missing_resend_api_key" };
  }

  const message = milestoneMessage(milestone);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject: milestoneTitle(milestone),
      html: buildHtml(milestone, message),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API ${response.status}: ${body}`);
  }

  return { sent: true };
}
