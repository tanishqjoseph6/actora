export const SITE_NAME = "Actora";

export const SITE_DESCRIPTION =
  "Your AI employee for email and operations — inbox automation, CRM, and team workflows.";

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    "https://www.useactora.com"
  );
}
