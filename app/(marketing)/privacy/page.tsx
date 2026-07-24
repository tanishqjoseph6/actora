import Link from "next/link";
import {
  LegalProse,
  MarketingPageHero,
} from "@/components/landing/MarketingPrimitives";
import { createPageMetadata } from "@/lib/marketing/seo";

export const metadata = createPageMetadata({
  title: "Privacy Policy",
  description:
    "How Actora collects, uses, and protects personal data across AI Inbox, CRM, and workspace features.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <MarketingPageHero
        badge="Legal"
        title="Privacy Policy"
        subtitle="Last updated: July 24, 2026. This policy explains what we collect, why we collect it, and the choices you have."
      />
      <LegalProse>
        <p>
          Actora (“we”, “us”, “our”) operates the Actora product at{" "}
          <Link href="/">useactora.com</Link>. This Privacy Policy describes how
          we handle information when you use our website, app, and related
          services.
        </p>

        <h2>1. Information we collect</h2>
        <h3>Account information</h3>
        <p>
          Name, email address, authentication identifiers, and workspace
          membership details when you sign up or are invited to a workspace.
        </p>
        <h3>Connected services</h3>
        <p>
          When you connect Gmail or calendar via Google OAuth, we receive tokens
          and the mailbox/calendar data required to provide AI Inbox, CRM
          linking, scheduling, and related features. We do not store your Google
          password.
        </p>
        <h3>Usage & product data</h3>
        <p>
          Feature usage, AI credit consumption, billing events, device/browser
          metadata, and diagnostic logs needed to operate and improve the
          service.
        </p>

        <h2>2. How we use information</h2>
        <ul>
          <li>Provide, secure, and improve Actora features</li>
          <li>Process AI requests you initiate (summaries, replies, Roxx AI)</li>
          <li>Manage workspaces, roles, invitations, and billing</li>
          <li>Send transactional email (security, billing, product notices)</li>
          <li>Detect abuse and enforce our Terms of Service</li>
        </ul>

        <h2>3. AI processing</h2>
        <p>
          Content you submit to AI features may be processed by our model
          providers solely to generate the requested output. We design prompts
          and retention to minimize unnecessary storage of sensitive content.
          Workspace AI credits track usage volume, not the full text of every
          request in billing systems.
        </p>

        <h2>4. Sharing</h2>
        <p>
          We share data with infrastructure and payment processors (for example
          hosting, authentication, analytics, and Razorpay) under contractual
          confidentiality. We do not sell personal information.
        </p>

        <h2>5. Retention</h2>
        <p>
          We retain account and workspace data while your account is active and
          for a limited period afterward as required for backups, disputes, and
          legal obligations. You may request deletion subject to lawful
          exceptions.
        </p>

        <h2>6. Security</h2>
        <p>
          We use encryption in transit, access controls, and workspace-scoped
          authorization. No method of transmission or storage is 100% secure; we
          continuously improve safeguards.
        </p>

        <h2>7. Cookies & similar technologies</h2>
        <p>
          We use cookies and similar technologies for authentication, security,
          preferences, and analytics. See our{" "}
          <Link href="/cookies">Cookie Policy</Link> for details and your
          choices.
        </p>

        <h2>8. Your rights</h2>
        <p>
          Depending on your location, you may have rights to access, correct,
          export, or delete personal data, or to object to certain processing.
          Contact{" "}
          <a href="mailto:privacy@useactora.com">privacy@useactora.com</a>.
        </p>

        <h2>9. Children</h2>
        <p>
          Actora is not directed to children under 16. We do not knowingly
          collect personal information from children.
        </p>

        <h2>10. Changes</h2>
        <p>
          We may update this policy. Material changes will be posted on this
          page with an updated date.
        </p>

        <h2>11. Contact</h2>
        <p>
          Privacy questions:{" "}
          <a href="mailto:privacy@useactora.com">privacy@useactora.com</a>.
          General contact: <Link href="/contact">Contact page</Link>.
        </p>
      </LegalProse>
    </>
  );
}
