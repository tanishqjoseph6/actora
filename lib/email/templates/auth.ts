import { actoraEmailLayout } from "@/lib/email/templates/layout";

export function buildPasswordResetEmail(actionLink: string) {
  return {
    subject: "Reset your Actora password",
    html: actoraEmailLayout({
      eyebrow: "ACTORA · SECURITY",
      heading: "Reset your password",
      body: "We received a request to reset your Actora password. This link expires soon. If you didn't request this, you can ignore this email.",
      ctaLabel: "Reset password",
      ctaHref: actionLink,
    }),
    text: `Reset your Actora password: ${actionLink}`,
  };
}

export function buildEmailVerificationEmail(actionLink: string) {
  return {
    subject: "Verify your Actora email",
    html: actoraEmailLayout({
      eyebrow: "ACTORA · VERIFY EMAIL",
      heading: "Confirm your email address",
      body: "Thanks for signing up for Actora. Verify your email to unlock your dashboard, Roxxx AI, and workspace features.",
      ctaLabel: "Verify email",
      ctaHref: actionLink,
    }),
    text: `Verify your Actora email: ${actionLink}`,
  };
}

export function buildSignupWelcomeVerificationEmail(actionLink: string) {
  return buildEmailVerificationEmail(actionLink);
}
