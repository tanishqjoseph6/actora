export function actoraEmailLayout(input: {
  eyebrow?: string;
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
}): string {
  const cta =
    input.ctaLabel && input.ctaHref
      ? `<tr><td style="padding-top:28px;">
          <a href="${input.ctaHref}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;font-size:14px;">${input.ctaLabel}</a>
        </td></tr>`
      : "";

  const eyebrow = input.eyebrow
    ? `<tr><td style="font-size:13px;color:#3B82F6;font-weight:600;letter-spacing:0.04em;">${input.eyebrow}</td></tr>`
    : `<tr><td style="font-size:13px;color:#3B82F6;font-weight:600;letter-spacing:0.04em;">ACTORA</td></tr>`;

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#05070B;color:#E2E8F0;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0B1220;border:1px solid #1E293B;border-radius:16px;padding:32px;">
        ${eyebrow}
        <tr><td style="padding-top:16px;font-size:24px;font-weight:700;color:#fff;">${input.heading}</td></tr>
        <tr><td style="padding-top:12px;font-size:15px;line-height:1.6;color:#94A3B8;">${input.body}</td></tr>
        ${cta}
      </table>
    </td></tr>
  </table>
</body></html>`;
}
