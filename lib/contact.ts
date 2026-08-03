export const FOUNDER_EMAIL = "founder@useactora.com";
export const FOUNDER_MAILTO = `mailto:${FOUNDER_EMAIL}`;

export const FOUNDER_SIGNATURE = `Tanishq Joseph
Founder & CEO
Actora
Where conversations become execution.
🌐 https://useactora.com
📧 ${FOUNDER_EMAIL}`;

export function withFounderSignature(text: string): string {
  return `${text}\n\n${FOUNDER_SIGNATURE}`;
}
